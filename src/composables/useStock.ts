import { useStockApi } from './useStockApi';
import { useStockStore } from './useStockStore';
import { useWatchlistState } from './useWatchlistState';

/**
 * 股票操作統一入口 - 提供向後相容的 API 介面
 * 整合 StockApi、StockStore 和 WatchlistState
 */
export function useStock() {
  const stockApi = useStockApi();
  const stockStore = useStockStore();
  const watchlistState = useWatchlistState();

  return {
    // 從 StockStore 來的狀態
    stocks: stockStore.stocks,
    lastUpdateTime: stockStore.lastUpdateTime,
    isUpdating: stockStore.isUpdating,
    updateError: stockStore.updateError,
    
    // 從 StockApi 來的狀態
    loading: stockApi.loading,
    error: stockApi.error,
    
    // 從 StockApi 來的方法
    fetchMultipleStocks: stockApi.fetchMultipleStocks,
    
    // 從 StockStore 來的方法
    updateStockData: stockStore.updateStockData,
    getStockData: stockStore.getStockData,
    clearStockData: stockStore.clearStockData,
    
    // 從 WatchlistState 來的便捷方法
    getStockCodes: () => watchlistState.stockCodes.value
  };
}