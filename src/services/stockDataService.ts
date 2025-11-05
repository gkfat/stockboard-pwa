import { twseApiService } from './TWSEApiService';
import { useStockStore } from '@/composables/useStockStore';
import { INTERVAL_SECONDS } from '@/constants';
import type { ProcessedStockInfo } from '@/types/twse-api';
import { useStockApi } from '@/composables/useStockApi';

/**
 * 股票資料統一管理服務 - Singleton
 * 職責：統一管理所有股票資料請求，避免重複 API 呼叫
 */
class StockDataService {
  private stockStore = useStockStore();
  private pendingRequests = new Map<string, Promise<ProcessedStockInfo | null>>();
  private batchRequests = new Map<string, { codes: string[]; promise: Promise<ProcessedStockInfo[]> }>();
  private lastUpdateTime = new Map<string, number>();

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(stockCode: string): boolean {
    const lastUpdate = this.lastUpdateTime.get(stockCode);
    if (!lastUpdate) return false;
    
    return (Date.now() - lastUpdate) < INTERVAL_SECONDS;
  }

  /**
   * 取得單支股票資料（優先使用快取）
   */
  async getSingleStock(stockCode: string): Promise<ProcessedStockInfo | null> {
    // 檢查快取
    const cachedData = this.stockStore.getStockData(stockCode);
    if (cachedData && this.isCacheValid(stockCode)) {
      console.log(`[StockDataService] 🎯 使用快取資料: ${stockCode}`);
      return {
        code: cachedData.code,
        name: cachedData.name,
        currentPrice: cachedData.currentPrice,
        yesterdayPrice: 0, // 從 StockInfo 無法取得
        openPrice: 0,
        highPrice: 0,
        lowPrice: 0,
        change: cachedData.change,
        changePercent: cachedData.changePercent,
        volume: 0,
        totalVolume: cachedData.volume,
        tradingDate: '',
        tradingTime: '',
        updatedAt: cachedData.updatedAt
      };
    }

    // 檢查是否已有進行中的請求
    if (this.pendingRequests.has(stockCode)) {
      console.log(`[StockDataService] ⏳ 等待進行中的請求: ${stockCode}`);
      return this.pendingRequests.get(stockCode)!;
    }

    // 發起新請求
    console.log(`[StockDataService] 🔄 發起新請求: ${stockCode}`);
    const promise = this.fetchSingleStockFromAPI(stockCode);
    this.pendingRequests.set(stockCode, promise);

    try {
      const result = await promise;
      if (result) {
        this.updateCache([result]);
      }
      return result;
    } finally {
      this.pendingRequests.delete(stockCode);
    }
  }

  /**
   * 批量取得股票資料（去重複、合併請求）
   */
  async getMultipleStocks(stockCodes: string[]): Promise<ProcessedStockInfo[]> {
    if (stockCodes.length === 0) return [];

    // 去重複
    const uniqueCodes = [...new Set(stockCodes)];
    
    // 分離需要更新和可以使用快取的股票
    const needUpdate: string[] = [];
    const cachedResults: ProcessedStockInfo[] = [];

    uniqueCodes.forEach(code => {
      const cachedData = this.stockStore.getStockData(code);
      if (cachedData && this.isCacheValid(code)) {
        console.log(`[StockDataService] 🎯 使用快取資料: ${code}`);
        cachedResults.push({
          code: cachedData.code,
          name: cachedData.name,
          currentPrice: cachedData.currentPrice,
          yesterdayPrice: 0,
          openPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          change: cachedData.change,
          changePercent: cachedData.changePercent,
          volume: 0,
          totalVolume: cachedData.volume,
          tradingDate: '',
          tradingTime: '',
          updatedAt: cachedData.updatedAt
        });
      } else {
        needUpdate.push(code);
      }
    });

    // 如果沒有需要更新的股票，直接回傳快取結果
    if (needUpdate.length === 0) {
      return cachedResults;
    }

    // 建立批量請求 key
    const batchKey = needUpdate.sort().join(',');
    
    // 檢查是否已有相同的批量請求
    if (this.batchRequests.has(batchKey)) {
      console.log(`[StockDataService] ⏳ 等待進行中的批量請求: ${batchKey}`);
      const batchResult = await this.batchRequests.get(batchKey)!.promise;
      return [...cachedResults, ...batchResult];
    }

    // 發起新的批量請求
    console.log('[StockDataService] 🔄 發起批量請求:', needUpdate);
    const promise = this.fetchMultipleStocksFromAPI(needUpdate);
    this.batchRequests.set(batchKey, { codes: needUpdate, promise });

    try {
      const freshResults = await promise;
      if (freshResults.length > 0) {
        this.updateCache(freshResults);
      }
      return [...cachedResults, ...freshResults];
    } finally {
      this.batchRequests.delete(batchKey);
    }
  }

  /**
   * 從 API 取得單支股票
   */
  private async fetchSingleStockFromAPI(stockCode: string): Promise<ProcessedStockInfo | null> {
    try {
      return await twseApiService.getStock(stockCode);
    } catch (error) {
      console.error(`[StockDataService] ❌ 取得單支股票失敗: ${stockCode}`, error);
      return null;
    }
  }

  /**
   * 從 API 批量取得股票
   */
  private async fetchMultipleStocksFromAPI(stockCodes: string[]): Promise<ProcessedStockInfo[]> {
    try {
      return await twseApiService.getStocks(stockCodes);
    } catch (error) {
      console.error('[StockDataService] ❌ 批量取得股票失敗:', stockCodes, error);
      return [];
    }
  }

  /**
   * 更新快取
   */
  private updateCache(stockInfos: ProcessedStockInfo[]): void {
    const {transformToStockInfo} = useStockApi();
    const stockInfosForStore = stockInfos.map(info => transformToStockInfo(info));
    this.stockStore.updateStockData(stockInfosForStore);
    
    // 更新時間戳
    stockInfos.forEach(info => {
      this.lastUpdateTime.set(info.code, Date.now());
    });
    
    console.log('[StockDataService] ✅ 更新快取:', stockInfos.map(s => s.code));
  }

  /**
   * 強制刷新指定股票
   */
  async forceRefresh(stockCodes: string[]): Promise<ProcessedStockInfo[]> {
    // 清除快取時間戳，強制重新取得
    stockCodes.forEach(code => {
      this.lastUpdateTime.delete(code);
    });
    
    return this.getMultipleStocks(stockCodes);
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.lastUpdateTime.clear();
    this.pendingRequests.clear();
    this.batchRequests.clear();
    console.log('[StockDataService] 🧹 快取已清除');
  }

  /**
   * 取得快取統計
   */
  getCacheStats() {
    return {
      cachedStocks: this.lastUpdateTime.size,
      pendingRequests: this.pendingRequests.size,
      batchRequests: this.batchRequests.size
    };
  }
}

// 匯出單例實例
export const stockDataService = new StockDataService();