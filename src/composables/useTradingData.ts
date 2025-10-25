import { ref, computed } from 'vue';
import { db } from '@/db/stockDB';
import { stockDataService } from '@/services/stockDataService';
import { PortfolioService } from '@/services/portfolioService';
import type { TradeRecord, StockPosition, TotalPnL } from '@/types/trading';
import type { ProcessedStockInfo } from '@/types/twse-api';

// 全域單例狀態 - 所有元件共享同一個記憶體位置
const trades = ref<TradeRecord[]>([]);
const stockPrices = ref<Record<string, ProcessedStockInfo>>({});
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * 計算股票持倉 (單例 computed)
 * 使用 PortfolioService
 */
const positions = computed((): StockPosition[] => {
  return PortfolioService.calculatePositions(trades.value, stockPrices.value);
});

/**
 * 計算總損益 (單例 computed)
 * 使用 PortfolioService
 */
const totalPnL = computed((): TotalPnL => {
  return PortfolioService.calculateTotalPnL(positions.value);
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
      
      // 將股票資料存入 stockPrices (注意：ProcessedStockInfo 使用 code 而非 ticker)
      stockData.forEach((stock: ProcessedStockInfo) => {
        stockPrices.value[stock.code] = stock;
      });
      
      console.log('[useTradingData] ✅ 載入股票價格:', stockData.map(s => `${s.code}: ${s.name}`));
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