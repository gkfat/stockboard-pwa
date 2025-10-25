import { ref, computed } from 'vue';
import { db } from '@/db/stockDB';
import { stockDataService } from '@/services/stockDataService';
import { TradingCalculator } from '@/utils/tradingCalculator';
import type { TradeRecord, StockPosition, TotalPnL } from '@/types/trading';
import type { ProcessedStockInfo } from '@/types/twse-api';
import { TradeDirection } from '@/enums/trade-direction';

// 全域單例狀態 - 所有元件共享同一個記憶體位置
const trades = ref<TradeRecord[]>([]);
const stockPrices = ref<Record<string, ProcessedStockInfo>>({});
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * 計算股票持倉 (單例 computed)
 */
const positions = computed((): StockPosition[] => {
  const positionMap = new Map<string, StockPosition>();

  trades.value.forEach(trade => {
    const ticker = trade.ticker;

    if (!positionMap.has(ticker)) {
      const stockInfo = stockPrices.value[ticker];
      positionMap.set(ticker, {
        ticker,
        stockName: stockInfo?.name || ticker,
        totalBuyQuantity: 0,
        totalSellQuantity: 0,
        avgBuyPrice: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalFees: 0,
        totalTax: 0,
        holdingQuantity: 0,
        marketValue: 0,
        currentPrice: stockInfo?.currentPrice || 0
      });
    }

    const position = positionMap.get(ticker)!;
    
    // 累計手續費和稅
    position.totalFees += trade.fee;
    position.totalTax += trade.tax;

    if (trade.direction === TradeDirection.BUY) {
      // 計算加權平均買入價格
      const newAvgPrice = TradingCalculator.calculateAverageBuyPrice(
        position.totalBuyQuantity,
        position.avgBuyPrice,
        trade.quantity,
        trade.price
      );
      position.totalBuyQuantity += trade.quantity;
      position.avgBuyPrice = newAvgPrice;
      position.totalBuyAmount += (trade.price * trade.quantity) + trade.fee;
    } else {
      // 賣出
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

    // 計算未實現損益（只有持有數量 > 0 時才計算）
    if (position.holdingQuantity > 0) {
      const rawUnrealizedPnL = TradingCalculator.calculateUnrealizedPnL(
        position.currentPrice,
        position.holdingQuantity,
        position.avgBuyPrice
      );

      // 計算賣出時的預估手續費和稅
      const sellFeeEstimate = TradingCalculator.estimateFees(
        position.currentPrice,
        position.holdingQuantity,
        TradeDirection.SELL
      );

      // 扣除預估賣出費用後的未實現損益
      position.unrealizedPnL = rawUnrealizedPnL - sellFeeEstimate.fee - sellFeeEstimate.tax;
      position.marketValue = position.currentPrice * position.holdingQuantity;
    }

    result.push(position);
  });

  return result;
});

/**
 * 計算總損益 (單例 computed)
 */
const totalPnL = computed((): TotalPnL => {
  const result: TotalPnL = {
    totalRealizedPnL: 0,
    totalUnrealizedPnL: 0,
    totalInvestment: 0,
    currentMarketValue: 0,
    totalFees: 0,
    totalTax: 0,
    totalPnL: 0
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
 * 交易資料 Composable (單例模式)
 * 職責：管理交易紀錄和損益計算
 * 所有元件呼叫此 composable 都會取得相同的記憶體位置
 */
export function useTradingData() {

  /**
   * 載入交易紀錄
   */
  const loadTradingData = async () => {
    try {
      loading.value = true;
      error.value = null;

      // 載入交易紀錄
      trades.value = await db.getAllTrades();

      // 取得所有需要的股票代號
      const tickerSet = new Set<string>(trades.value.map(trade => trade.ticker));
      const tickers = Array.from(tickerSet);

      if (tickers.length > 0) {
        await loadStockPrices(tickers);
      }

    } catch (err) {
      console.error('[useTradingData] ❌ 載入交易紀錄失敗:', err);
      error.value = '載入交易紀錄失敗';
    } finally {
      loading.value = false;
    }
  };

  /**
   * 載入股票價格
   */
  const loadStockPrices = async (tickers: string[]) => {
    try {
      // 使用 stockDataService 載入股票資料
      const stockData = await stockDataService.getMultipleStocks(tickers);
      
      // 將股票資料存入 stockPrices
      stockData.forEach((stock: any) => {
        stockPrices.value[stock.ticker] = stock;
      });
    } catch (err) {
      console.error('[useTradingData] ❌ 載入股票價格失敗:', err);
      error.value = '載入股票價格失敗';
    }
  };

  /**
   * 新增交易紀錄
   */
  const addTrade = async (tradeData: Omit<TradeRecord, 'id'>) => {
    try {
      loading.value = true;
      error.value = null;

      // 新增到資料庫
      const newTrade = await db.addTrade(tradeData);

      // 更新本地狀態
      trades.value.push(newTrade);

      // 如果是新股票，載入其價格資料
      if (!stockPrices.value[tradeData.ticker]) {
        await loadStockPrices([tradeData.ticker]);
      }

      return newTrade;
    } catch (err) {
      console.error('[useTradingData] ❌ 新增交易紀錄失敗:', err);
      error.value = '新增交易紀錄失敗';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // 狀態 (單例)
    trades,
    stockPrices,
    positions,
    totalPnL,
    loading,
    error,
    
    // 方法
    loadTradingData,
    addTrade
  };
}