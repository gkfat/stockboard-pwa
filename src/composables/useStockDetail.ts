import { ref } from 'vue';
import { stockDataService } from '@/services/stockDataService';
import type { ProcessedStockInfo } from '@/types/twse-api';

/**
 * 股票詳細資訊 Composable
 * 職責：處理單一股票的詳細資料載入
 */
export function useStockDetail() {
  const stockInfo = ref<ProcessedStockInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 載入股票詳細資訊
   */
  const loadStockDetail = async (stockCode: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    stockInfo.value = null;

    try {
      console.log(`[useStockDetail] 透過 stockDataService 取得: ${stockCode}`);
      const data = await stockDataService.getSingleStock(stockCode);
      stockInfo.value = data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '載入股票詳情失敗';
      error.value = errorMsg;
      console.error('[useStockDetail] ❌ 載入失敗:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重新載入股票資訊
   */
  const reload = async (): Promise<void> => {
    if (stockInfo.value) {
      await loadStockDetail(stockInfo.value.code);
    }
  };

  /**
   * 清除資料
   */
  const clear = (): void => {
    stockInfo.value = null;
    error.value = null;
  };

  return {
    // 狀態
    stockInfo,
    loading,
    error,
    
    // 方法
    loadStockDetail,
    reload,
    clear
  };
}