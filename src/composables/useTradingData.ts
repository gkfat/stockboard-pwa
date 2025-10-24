import { ref, computed } from 'vue';
import { db } from '@/db/stockDB';
import { stockDataService } from '@/services/stockDataService';
import { TradingCalculator } from '@/utils/tradingCalculator';
import type { TradeRecord, StockPosition, TotalPnL } from '@/types/trading';
import type { ProcessedStockInfo } from '@/types/twse-api';

/**
 * 交易資料 Composable
 * 職責：管理交易紀錄和損益計算
 */
export function useTradingData() {
  const trades = ref<TradeRecord[]>([]);
  const stockPrices = ref<Record<string, ProcessedStockInfo>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 載入交易紀錄
   */
  const loadTrades = async (): Promise<void> => {
    try {
      await db.checkReady();
      const tradeRecords = await db.trades.toArray();
      trades.value = tradeRecords;
    } catch (err) {
      console.error('[useTradingData] ❌ 載入交易紀錄失敗:', err);
      error.value = '載入交易紀錄失敗';
    }
  };

  /**
   * 載入股票目前價格
   */
  const loadStockPrices = async (): Promise<void> => {
    try {
      const uniqueTickers = [...new Set(trades.value.map(t => t.ticker))];
      if (uniqueTickers.length === 0) return;

      console.log('[useTradingData] 透過 stockDataService 取得價格:', uniqueTickers);
      const stockInfos = await stockDataService.getMultipleStocks(uniqueTickers);
      const pricesMap: Record<string, ProcessedStockInfo> = {};
      
      stockInfos.forEach(info => {
        pricesMap[info.code] = info;
      });
      
      stockPrices.value = pricesMap;
      
      console.log('[useTradingData] ✅ 載入股票價格完成 (已透過 stockDataService 自動同步):', uniqueTickers);
    } catch (err) {
      console.error('[useTradingData] ❌ 載入股票價格失敗:', err);
      error.value = '載入股票價格失敗';
    }
  };

  /**
   * 計算股票持倉
   */
  const positions = computed((): StockPosition[] => {
    const positionMap = new Map<string, StockPosition>();

    trades.value.forEach(trade => {
      const ticker = trade.ticker;
      const stockInfo = stockPrices.value[ticker];
      
      if (!positionMap.has(ticker)) {
        positionMap.set(ticker, {
          ticker,
          stockName: stockInfo?.name || ticker,
          totalBuyQuantity: 0,
          totalSellQuantity: 0,
          holdingQuantity: 0,
          avgBuyPrice: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          currentPrice: stockInfo?.currentPrice || 0,
          marketValue: 0,
          totalFees: 0,
          totalTax: 0
        });
      }

      const position = positionMap.get(ticker)!;
      
      // 累計費用
      position.totalFees += trade.fee;
      position.totalTax += trade.tax;

      if (trade.direction === 'BUY') {
        // 買入邏輯
        const newAvgPrice = TradingCalculator.calculateAverageBuyPrice(
          position.totalBuyQuantity,
          position.avgBuyPrice,
          trade.quantity,
          trade.price
        );
        
        position.totalBuyQuantity += trade.quantity;
        position.avgBuyPrice = newAvgPrice;
        position.totalBuyAmount += (trade.price * trade.quantity) + trade.fee;
        
      } else if (trade.direction === 'SELL') {
        // 賣出邏輯
        position.totalSellQuantity += trade.quantity;
        position.totalSellAmount += (trade.price * trade.quantity) - trade.fee - trade.tax;
        
        // 計算已實現損益
        const realizedPnL = TradingCalculator.calculateRealizedPnL(
          trade.price,
          trade.quantity,
          position.avgBuyPrice,
          trade.fee,
          trade.tax
        );
        position.realizedPnL += realizedPnL;
      }
    });

    // 計算每個持倉的最終數據
    const result: StockPosition[] = [];
    positionMap.forEach(position => {
      // 計算持有數量
      position.holdingQuantity = position.totalBuyQuantity - position.totalSellQuantity;
      
      // 計算未實現損益（包含手續費）
      if (position.holdingQuantity > 0) {
        const rawUnrealizedPnL = TradingCalculator.calculateUnrealizedPnL(
          position.currentPrice,
          position.holdingQuantity,
          position.avgBuyPrice
        );
        
        // 計算賣出時的手續費和交易稅
        const sellFeeEstimate = TradingCalculator.estimateFees(
          position.currentPrice,
          position.holdingQuantity,
          'SELL'
        );
        
        // 未實現損益需扣除賣出時的手續費和交易稅
        position.unrealizedPnL = rawUnrealizedPnL - sellFeeEstimate.fee - sellFeeEstimate.tax;
        position.marketValue = position.currentPrice * position.holdingQuantity;
      }
      
      result.push(position);
    });

    return result.filter(p => p.totalBuyQuantity > 0); // 只顯示有交易紀錄的股票
  });

  /**
   * 計算總損益
   */
  const totalPnL = computed((): TotalPnL => {
    const result: TotalPnL = {
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      totalPnL: 0,
      totalInvestment: 0,
      currentMarketValue: 0,
      totalFees: 0,
      totalTax: 0
    };

    positions.value.forEach(position => {
      result.totalRealizedPnL += position.realizedPnL;
      result.totalUnrealizedPnL += position.unrealizedPnL;
      result.totalInvestment += position.totalBuyAmount;
      result.currentMarketValue += position.marketValue;
      result.totalFees += position.totalFees;
      result.totalTax += position.totalTax;
    });

    result.totalPnL = result.totalRealizedPnL + result.totalUnrealizedPnL;

    return result;
  });

  /**
   * 新增交易紀錄
   */
  const addTrade = async (trade: Omit<TradeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      await db.checkReady();
      
      const newTrade: TradeRecord = {
        ...trade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await db.trades.add(newTrade);
      await loadTradingData(); // 重新載入所有數據
      
      return true;
    } catch (err) {
      console.error('[useTradingData] ❌ 新增交易紀錄失敗:', err);
      error.value = '新增交易紀錄失敗';
      return false;
    }
  };

  /**
   * 載入所有交易相關數據
   */
  const loadTradingData = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      await loadTrades();
      await loadStockPrices();
    } catch (err) {
      console.error('[useTradingData] ❌ 載入交易數據失敗:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    // 狀態
    trades,
    positions,
    totalPnL,
    loading,
    error,
    
    // 方法
    loadTradingData,
    addTrade
  };
}