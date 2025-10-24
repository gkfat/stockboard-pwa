import { ref } from 'vue';
import { watchlistService } from '@/services/watchlistService';

/**
 * 觀察清單操作 Composable - 純粹提供操作方法
 * 職責：封裝用戶操作邏輯，調用 service 方法
 */
export function useWatchlistActions() {
  const isProcessing = ref(false);
  const actionError = ref<string | null>(null);

  /**
   * 新增股票到觀察清單
   */
  const addStock = async (code: string, name: string): Promise<boolean> => {
    isProcessing.value = true;
    actionError.value = null;

    try {
      const success = await watchlistService.addToWatchlist(code, name);
      if (!success) {
        actionError.value = '新增股票失敗';
      }
      return success;
    } catch (error) {
      actionError.value = error instanceof Error ? error.message : '新增股票失敗';
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 從觀察清單移除股票
   */
  const removeStock = async (code: string): Promise<boolean> => {
    isProcessing.value = true;
    actionError.value = null;

    try {
      const success = await watchlistService.removeFromWatchlist(code);
      if (!success) {
        actionError.value = '移除股票失敗';
      }
      return success;
    } catch (error) {
      actionError.value = error instanceof Error ? error.message : '移除股票失敗';
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 初始化觀察清單
   */
  const initializeWatchlist = async (): Promise<void> => {
    isProcessing.value = true;
    actionError.value = null;

    try {
      await watchlistService.initialize();
    } catch (error) {
      actionError.value = error instanceof Error ? error.message : '初始化失敗';
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 清除操作錯誤
   */
  const clearActionError = () => {
    actionError.value = null;
  };

  return {
    // 狀態
    isProcessing,
    actionError,
    
    // 操作方法
    addStock,
    removeStock,
    initializeWatchlist,
    clearActionError
  };
}