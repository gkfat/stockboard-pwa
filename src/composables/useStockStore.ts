import { ref } from 'vue';
import type { StockInfo } from '@/types/stock';

/**
 * 股票資料存儲 - 純粹負責股票資料的狀態管理
 * 職責：股票資料快取、狀態管理、更新時間追蹤
 */

// 全域單例狀態
const stocks = ref<Record<string, StockInfo>>({});
const lastUpdateTime = ref<string>('');
const isUpdating = ref(false);
const updateError = ref<string | null>(null);

export function useStockStore() {
  /**
   * 更新股票資料
   */
  const updateStockData = (stockInfos: StockInfo[]) => {
    stockInfos.forEach(stockInfo => {
      stocks.value[stockInfo.code] = stockInfo;
    });
    lastUpdateTime.value = new Date().toISOString();
  };

  /**
   * 取得特定股票資料
   */
  const getStockData = (code: string): StockInfo | null => {
    return stocks.value[code] || null;
  };

  /**
   * 清除股票資料
   */
  const clearStockData = () => {
    stocks.value = {};
    lastUpdateTime.value = '';
  };

  /**
   * 設定更新狀態
   */
  const setUpdatingState = (updating: boolean, error: string | null = null) => {
    isUpdating.value = updating;
    updateError.value = error;
  };


  return {
    // 響應式狀態
    stocks,
    lastUpdateTime,
    isUpdating,
    updateError,
    
    // 方法
    updateStockData,
    getStockData,
    clearStockData,
    setUpdatingState
  };
}