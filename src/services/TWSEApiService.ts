import { axiosAgent } from './axiosAgent';
import { useStockPriceHistory } from '@/composables/useStockPriceHistory';
import type { 
  TWStockApiResponse, 
  TWStockData, 
  ProcessedStockInfo,
  TWStockApiError 
} from '@/types/twse-api';

class TWSEApiService {
  /**
   * 從歷史價格中取得最新價格
   */
  private getLatestPriceFromHistory(stockCode: string): number | null {
    try {
      const { priceHistories } = useStockPriceHistory();
      const history = priceHistories.value[stockCode];
      
      if (!history || history.length === 0) {
        return null;
      }

      // 按日期和時間排序，取最新的一筆
      const sortedHistory = history.sort((a, b) => {
        const dateTimeA = `${a.date} ${a.time}`;
        const dateTimeB = `${b.date} ${b.time}`;
        return dateTimeB.localeCompare(dateTimeA); // 降序排列
      });

      const latestRecord = sortedHistory[0];
      
      return latestRecord.price;
    } catch (error) {
      console.warn(`[TWSEApiService] ⚠️ 無法從歷史價格取得 ${stockCode} 資料:`, error);
      return null;
    }
  }

  /**
   * 將 TWSE 原始資料轉換為處理後的股票資訊
   */
  private transformStockData(rawData: TWStockData): ProcessedStockInfo {
    console.log(rawData.c, rawData.z, rawData.y);
    const yesterdayPrice = parseFloat(rawData.y) || 0;
    let currentPrice = parseFloat(rawData.z) || -1;
    
    // 如果 currentPrice 為 -1，嘗試從歷史價格中取得最新資料
    if (currentPrice === -1) {
      const historyPrice = this.getLatestPriceFromHistory(rawData.c);
      if (historyPrice !== null && historyPrice > 0) {
        currentPrice = historyPrice;
      } else {
        currentPrice = yesterdayPrice;
      }
    }
    
    const change = currentPrice > 0 ? currentPrice - yesterdayPrice : 0;
    const changePercent = yesterdayPrice > 0 && currentPrice > 0 ? (change / yesterdayPrice) * 100 : 0;

    return {
      code: rawData.c,
      name: rawData.n,
      currentPrice,
      yesterdayPrice,
      openPrice: parseFloat(rawData.o) || 0,
      highPrice: parseFloat(rawData.h) || 0,
      lowPrice: parseFloat(rawData.l) || 0,
      change,
      changePercent,
      volume: parseInt(rawData.v) || 0,
      totalVolume: parseInt(rawData.tv) || 0,
      tradingDate: rawData.d || '',
      tradingTime: rawData.t || '',
      timestamp: parseInt(rawData.tlong) || 0
    };
  }

  /**
   * 取得 API 基礎 URL
   * 開發環境使用 Vite proxy，生產環境使用 serverless function
   */
  private getBaseUrl(): string {
    // 開發環境使用 proxy
    if (import.meta.env.DEV) {
      return '/api';
    }
    // 生產環境使用 serverless function (避免 CORS)
    return '/api/twse';
  }

  /**
   * 建立 TWSE API 請求 URL
   */
  private buildApiUrl(stockCodes: string | string[]): string {
    const codes = Array.isArray(stockCodes) ? stockCodes : [stockCodes];
    const exchangeCodes = codes.map(code => `tse_${code}.tw`).join('|');
    const baseUrl = this.getBaseUrl();

    // 開發環境: proxy 到 TWSE API
    if (import.meta.env.DEV) {
      return `${baseUrl}/getStockInfo.jsp?ex_ch=${exchangeCodes}`;
    }
    
    // 生產環境: 使用 serverless function
    return `${baseUrl}/getStockInfo?ex_ch=${exchangeCodes}`;
  }

  /**
   * 取得單支股票資訊
   */
  async getStock(stockCode: string): Promise<ProcessedStockInfo> {
    try {
      const url = this.buildApiUrl(stockCode);
      const response = await axiosAgent.get<TWStockApiResponse>(url);
      
      if (!response.data.msgArray || response.data.msgArray.length === 0) {
        throw new Error(`查無股票代號: ${stockCode}`);
      }

      const stockData = this.transformStockData(response.data.msgArray[0]);
      
      return stockData;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '取得股票資料失敗';
      console.error(`[TWSEApiService] ❌ 取得股票失敗: ${stockCode}`, error);
      
      const apiError: TWStockApiError = {
        message: errorMsg,
        code: stockCode
      };
      throw apiError;
    }
  }

  /**
   * 批量取得多支股票資訊
   */
  async getStocks(stockCodes: string[]): Promise<ProcessedStockInfo[]> {
    if (stockCodes.length === 0) {
      return [];
    }

    try {
      const url = this.buildApiUrl(stockCodes);
      const response = await axiosAgent.get<TWStockApiResponse>(url);
      
      if (!response.data.msgArray) {
        return [];
      }

      const stockInfos = response.data.msgArray.map(data => this.transformStockData(data));
   
      return stockInfos;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '批量取得股票資料失敗';
      console.error('[TWSEApiService] ❌ 批量取得股票失敗', { codes: stockCodes, error });
      
      const apiError: TWStockApiError = {
        message: errorMsg,
        code: stockCodes.join(',')
      };
      throw apiError;
    }
  }

  /**
   * 檢查 API 服務狀態
   */
  async checkApiStatus(): Promise<boolean> {
    try {
      // 使用台積電作為測試股票
      await this.getStock('2330');
      return true;
    } catch (error) {
      console.error('[TWSEApiService] ❌ API 服務檢查失敗:', error);
      return false;
    }
  }
}

// 匯出單例實例
export const twseApiService = new TWSEApiService();