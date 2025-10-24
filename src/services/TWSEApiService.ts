import { axiosAgent } from './axiosAgent';
import type { 
  TWStockApiResponse, 
  TWStockData, 
  ProcessedStockInfo,
  TWStockApiError 
} from '@/types/twse-api';

class TWSEApiService {
  private readonly API_BASE = '/api/twse/getStockInfo.jsp';

  /**
   * 將 TWSE 原始資料轉換為處理後的股票資訊
   */
  private transformStockData(rawData: TWStockData): ProcessedStockInfo {
    const yesterdayPrice = parseFloat(rawData.y) || 0;
    const currentPrice = parseFloat(rawData.z) || yesterdayPrice || 0;
    const change = currentPrice - yesterdayPrice;
    const changePercent = yesterdayPrice > 0 ? (change / yesterdayPrice) * 100 : 0;

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
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 建立 TWSE API 請求 URL
   */
  private buildApiUrl(stockCodes: string | string[]): string {
    const codes = Array.isArray(stockCodes) ? stockCodes : [stockCodes];
    const exchangeCodes = codes.map(code => `tse_${code}.tw`).join('|');
    return `${this.API_BASE}?ex_ch=${exchangeCodes}`;
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