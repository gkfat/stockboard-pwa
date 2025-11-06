import { useStockApi } from './useStockApi';
import { useStockStore } from './useStockStore';
import { useWatchlistState } from './useWatchlistState';
import { useMarketTime } from './useMarketTime';
import { useStockPriceHistory } from './useStockPriceHistory';
import { db } from '@/db/stockDB';
import { INTERVAL_SECONDS } from '@/constants';

// 全域單例狀態，防止重複註冊 interval
let updaterInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 股票資料自動更新邏輯
 */
export function useStockUpdater() {
  const { fetchMultipleStocks } = useStockApi();
  const { updateStockData, setUpdatingState, isUpdating } = useStockStore();
  const { stockCodes } = useWatchlistState();
  const { isMarketOpen } = useMarketTime();
  const { savePriceHistory } = useStockPriceHistory();

  // 回填初始價格（當 API 價格為 -1 時）
  const backfillInitialPrices = async (stockInfos: any[]) => {
    const updatedStockInfos = [];
    
    for (const stock of stockInfos) {
      if (stock.currentPrice === -1) {
        try {
          // 嘗試從資料庫取得最新價格
          const latestPrice = await db.getLatestPrice(stock.code);
          if (latestPrice && latestPrice.price > 0) {
            const updatedStock = {
              ...stock,
              currentPrice: latestPrice.price,
              change: latestPrice.price - stock.yesterdayPrice,
              changePercent: stock.yesterdayPrice > 0 
                ? ((latestPrice.price - stock.yesterdayPrice) / stock.yesterdayPrice) * 100 
                : 0
            };
            
            console.log(`[StockUpdater] 🔄 ${stock.code} 使用資料庫最新價格: ${latestPrice.price} (${latestPrice.updatedAt})`);
            updatedStockInfos.push(updatedStock);
          } else {
            console.log(`[StockUpdater] ⚠️ ${stock.code} 無法取得最新價格，保持 -1`);
            updatedStockInfos.push(stock);
          }
        } catch (error) {
          console.warn(`[StockUpdater] ⚠️ 回填 ${stock.code} 價格失敗:`, error);
          updatedStockInfos.push(stock);
        }
      } else {
        updatedStockInfos.push(stock);
      }
    }
    
    return updatedStockInfos;
  };

  // 更新所有自選股報價
  const updateAllStocks = async () => {
    if (isUpdating.value) return;
    
    const codes = stockCodes.value;
    if (codes.length === 0) return;

    setUpdatingState(true, null);

    try {
      let stockInfos = await fetchMultipleStocks(codes);
      
      // 回填初始價格（當 API 價格為 -1 時使用資料庫最新價格）
      stockInfos = await backfillInitialPrices(stockInfos);
      
      // 立即更新股票資訊供 UI 顯示
      updateStockData(stockInfos);

      // 非同步儲存價格歷史，不阻塞 UI 更新
      if (isMarketOpen.value && stockInfos.length > 0) {
        savePriceHistory(stockInfos).catch(error => {
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
    if (updaterInterval) {
      console.log('[StockUpdater] ⚠️ 自動更新已在運行中，跳過重複啟動');
      return;
    }

    console.log('[StockUpdater] ▶️ 啟動自動更新');

    // 立即執行一次更新
    updateAllStocks();

    // 設定定時更新
    updaterInterval = setInterval(() => {
      if (stockCodes.value.length > 0) {
        updateAllStocks();
      } else {
        console.log('[StockUpdater] 📝 觀察清單為空，跳過更新');
      }
    }, INTERVAL_SECONDS);
  };

  // 停止自動更新
  const stopAutoUpdate = () => {
    if (updaterInterval) {
      clearInterval(updaterInterval);
      updaterInterval = null;
      console.log('[StockUpdater] ⏹️ 自動更新已停止');
    }
  };

  return {
    updateAllStocks,
    startAutoUpdate,
    stopAutoUpdate
  };
}