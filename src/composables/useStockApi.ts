import { ref } from 'vue';
import { stockDataService } from '@/services/stockDataService';
import type { StockInfo } from '@/types/stock';
import type { ProcessedStockInfo } from '@/types/twse-api';

/**
 * 股票 API 操作 - 純粹負責與外部 API 的資料交換
 * 職責：取得股票資料、API 錯誤處理
 */
export function useStockApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 將 ProcessedStockInfo 轉換為 StockInfo 格式 (向後相容)
   */
  const transformToStockInfo = (data: ProcessedStockInfo): StockInfo => {

    return {
      code: data.code,
      name: data.name,
      currentPrice: data.currentPrice,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.totalVolume,
      totalVolume: data.totalVolume,
      updatedAt: new Date(data.timestamp).toISOString(),
      tradingDate: data.tradingDate,
      tradingTime: data.tradingTime,
      yesterdayPrice: data.yesterdayPrice,
      highPrice: data.highPrice,
      lowPrice: data.lowPrice,
      openPrice: data.openPrice
    };
  };

  /**
   * 批量取得多支股票資訊
   */
  const fetchMultipleStocks = async (stockCodes: string[]): Promise<StockInfo[]> => {
    loading.value = true;
    error.value = null;

    try {
      if (stockCodes.length === 0) return [];

      const processedStocks = await stockDataService.getMultipleStocks(stockCodes);
      const results = processedStocks.map(transformToStockInfo);

      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '取得股票資料失敗';
      error.value = errorMsg;
      console.error('[useStockApi] ❌ 批量取得失敗:', err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  return {
    // 狀態
    loading,
    error,
    
    // 方法
    fetchMultipleStocks,
    transformToStockInfo
  };
}