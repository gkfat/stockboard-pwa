import { ref } from 'vue';
import { db } from '@/db/stockDB';
import { WatchListItem } from '@/types/db';

/**
 * 觀察清單服務 - 統一的觀察清單操作介面
 * 負責所有觀察清單的 CRUD 操作和狀態管理
 */
class WatchlistService {
  // 響應式狀態
  private _watchlist = ref<WatchListItem[]>([]);
  private _loading = ref(false);
  private _error = ref<string | null>(null);

  // LocalStorage 備份 key
  private readonly STORAGE_KEY = 'stockboard_watchlist';

  // 變更回調函數
  private changeCallbacks: (() => void | Promise<void>)[] = [];

  // Getters
  get watchlist() {
    return this._watchlist;
  }

  get loading() {
    return this._loading;
  }

  get error() {
    return this._error;
  }

  get stockCodes() {
    return this._watchlist.value.map(stock => stock.code);
  }

  /**
   * 初始化 - 從資料庫載入觀察清單
   */
  async initialize(): Promise<void> {
    this._loading.value = true;
    this._error.value = null;

    try {
      await db.checkReady();
      
      // 優先從 Dexie 讀取，按 index 排序
      const stocks = await db.watchlist.orderBy('index').toArray();
      
      if (stocks.length > 0) {
        this._watchlist.value = stocks;
      } else {
        // Fallback 到 LocalStorage
        await this.loadFromLocalStorage();
      }
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '載入觀察清單失敗';
      console.error('[WatchlistService] ERROR 載入觀察清單失敗:', error);
    } finally {
      this._loading.value = false;
    }
  }

  /**
   * 新增股票到觀察清單
   */
  async addToWatchlist(code: string, name: string): Promise<boolean> {
    try {
      // 檢查是否已存在
      if (this.isInWatchlist(code)) {
        throw new Error('此股票已在觀察清單中');
      }

      // 計算新的 index（最大值 + 1）
      const maxIndex = this._watchlist.value.length > 0 
        ? Math.max(...this._watchlist.value.map(item => item.index || 0))
        : -1;
      
      const newItem: WatchListItem = { 
        code, 
        name, 
        index: maxIndex + 1 
      };
      
      // 儲存到資料庫
      await db.checkReady();
      await db.watchlist.add(newItem);
      
      // 更新本地狀態並重新排序
      this._watchlist.value.push(newItem);
      this.sortWatchlist();
      
      // 同步到 LocalStorage
      this.syncToLocalStorage();

      // 觸發變更回調
      await this.triggerChangeCallbacks();
      
      return true;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '新增股票失敗';
      console.error('[WatchlistService] ERROR 新增股票失敗:', error);
      return false;
    }
  }

  /**
   * 從觀察清單移除股票
   */
  async removeFromWatchlist(code: string): Promise<boolean> {
    try {
      // 從資料庫移除
      await db.checkReady();
      await db.watchlist.delete(code);
      
      // 更新本地狀態
      this._watchlist.value = this._watchlist.value.filter(stock => stock.code !== code);
      
      // 重新排序剩餘項目的 index
      await this.reorderWatchlist();
      
      // 同步到 LocalStorage
      this.syncToLocalStorage();

      // 觸發變更回調
      await this.triggerChangeCallbacks();
      
      return true;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '移除股票失敗';
      console.error('[WatchlistService] ERROR 移除股票失敗:', error);
      return false;
    }
  }

  /**
   * 檢查股票是否在觀察清單中
   */
  isInWatchlist(code: string): boolean {
    return this._watchlist.value.some(stock => stock.code === code);
  }

  /**
   * 註冊變更回調函數
   */
  onWatchlistChange(callback: () => void | Promise<void>): void {
    this.changeCallbacks.push(callback);
  }

  // 私有方法

  /**
   * 從 LocalStorage 載入資料
   */
  private async loadFromLocalStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored) as WatchListItem[];
        
        // 為舊資料補充 index 欄位
        const watchlistWithIndex = parsedData.map((stock, index) => ({
          ...stock,
          index: stock.index !== undefined ? stock.index : index
        }));
        
        this._watchlist.value = watchlistWithIndex;
        
        // 同步到資料庫
        if (watchlistWithIndex.length > 0) {
          await db.watchlist.bulkAdd(watchlistWithIndex);
        }
      }
    } catch (error) {
      console.warn('[WatchlistService] WARN LocalStorage 載入失敗:', error);
    }
  }

  /**
   * 同步到 LocalStorage
   */
  private syncToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._watchlist.value));
    } catch (error) {
      console.warn('[WatchlistService] WARN LocalStorage 同步失敗:', error);
    }
  }

  /**
   * 觸發所有變更回調
   */
  private async triggerChangeCallbacks(): Promise<void> {
    for (const callback of this.changeCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('[WatchlistService] ERROR 回調執行失敗:', error);
      }
    }
  }

  /**
   * 排序觀察清單（按 index 欄位）
   */
  private sortWatchlist(): void {
    this._watchlist.value.sort((a, b) => (a.index || 0) - (b.index || 0));
  }

  /**
   * 重新排序觀察清單的 index（移除項目後使用）
   */
  private async reorderWatchlist(): Promise<void> {
    try {
      // 重新分配 index，從 0 開始
      const reorderedItems = this._watchlist.value.map((item, index) => ({
        ...item,
        index
      }));

      // 批量更新資料庫
      await db.checkReady();
      const transaction = db.transaction('rw', db.watchlist, async () => {
        for (const item of reorderedItems) {
          await db.watchlist.put(item);
        }
      });
      
      await transaction;
      
      // 更新本地狀態
      this._watchlist.value = reorderedItems;
    } catch (error) {
      console.error('[WatchlistService] ERROR 重新排序失敗:', error);
    }
  }
}

// 建立單例實例
export const watchlistService = new WatchlistService();

