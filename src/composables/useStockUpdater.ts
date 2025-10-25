import { ref } from 'vue';
import { useStockApi } from './useStockApi';
import { useStockStore } from './useStockStore';
import { useWatchlistState } from './useWatchlistState';
import { useMarketTime } from './useMarketTime';
import { useStockPrice } from './useStockPrice';
import { CACHE_CONFIG } from '@/constants';

/**
 * 股票資料自動更新邏輯
 */
export function useStockUpdater() {
  const { fetchMultipleStocks } = useStockApi();
  const { updateStockData, setUpdatingState, isUpdating } = useStockStore();
  const { stockCodes } = useWatchlistState();
  const { isMarketOpen } = useMarketTime();
  const { savePriceHistory } = useStockPrice();

  // === Singleton State ===
  // 全域單例狀態，防止重複註冊 interval
  let globalUpdateInterval: ReturnType<typeof setInterval> | null = null;
  const globalIsAutoUpdateEnabled = ref(false);
  const UPDATE_INTERVAL = CACHE_CONFIG.STOCK_DATA_DURATION; // 使用統一常數

  // 更新所有自選股報價
  const updateAllStocks = async () => {
    if (isUpdating.value) return;
    
    const codes = stockCodes.value;
    if (codes.length === 0) return;

    setUpdatingState(true, null);

    try {
      console.log('[StockUpdater] 開始更新股票資料');
      
      const stockInfos = await fetchMultipleStocks(codes);
      
      // 立即更新股票資訊供 UI 顯示
      updateStockData(stockInfos);

      // 非同步儲存價格歷史，不阻塞 UI 更新
      if (isMarketOpen.value && stockInfos.length > 0) {
        savePriceHistory(stockInfos, true).catch(error => {
          console.warn('[StockUpdater] WARN 價格歷史儲存失敗:', error);
        });
      }

      return stockInfos;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '更新失敗';
      setUpdatingState(false, errorMsg);
      console.error('[StockUpdater] ERROR 更新股票資料失敗:', error);
      throw error;
    } finally {
      setUpdatingState(false, null);
    }
  };

  // 啟動自動更新（全域單例）
  const startAutoUpdate = () => {
    // 如果已經在自動更新，不重複啟動
    if (globalIsAutoUpdateEnabled.value && globalUpdateInterval) {
      console.log('[StockUpdater] ⚠️ 自動更新已在運行中，跳過重複啟動');
      return;
    }

    // 清理現有的 interval（防止記憶體洩漏）
    if (globalUpdateInterval) {
      clearInterval(globalUpdateInterval);
    }

    globalIsAutoUpdateEnabled.value = true;
    console.log('[StockUpdater] ▶️ 啟動自動更新');

    // 立即執行一次更新
    updateAllStocks();

    // 設定定時更新
    globalUpdateInterval = setInterval(() => {
      if (stockCodes.value.length > 0) {
        updateAllStocks();
      } else {
        console.log('[StockUpdater] 📝 觀察清單為空，跳過更新');
      }
    }, UPDATE_INTERVAL);
  };

  // 停止自動更新（全域單例）
  const stopAutoUpdate = () => {
    if (globalUpdateInterval) {
      clearInterval(globalUpdateInterval);
      globalUpdateInterval = null;
    }
    globalIsAutoUpdateEnabled.value = false;
    console.log('[StockUpdater] ⏹️ 自動更新已停止');
  };

  // 手動強制更新
  const forceUpdate = async () => {
    console.log('[StockUpdater] 手動強制更新');
    return await updateAllStocks();
  };

  // 檢查自動更新狀態
  const isAutoUpdateRunning = () => {
    return globalIsAutoUpdateEnabled.value && globalUpdateInterval !== null;
  };

  return {
    // 狀態
    isAutoUpdateEnabled: globalIsAutoUpdateEnabled,
    
    // 方法
    updateAllStocks,
    startAutoUpdate,
    stopAutoUpdate,
    forceUpdate,
    isAutoUpdateRunning
  };
}