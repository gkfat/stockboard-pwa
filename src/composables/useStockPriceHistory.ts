import { ref } from 'vue';
import { db } from '@/db/stockDB';
import type { HistoryPrice, PriceQueryParams } from '@/types/db';
import { StockInfo } from '@/types/stock';
import { DateUtils } from '@/utils/dateUtils';

// 價格歷史資料管理
const priceHistories = ref<Record<string, HistoryPrice[]>>({});

export function useStockPriceHistory() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Price 操作包裝器
  const priceOps = {
    async bulkAdd(prices: HistoryPrice[]) {
      try {
        const result = await db.prices.bulkAdd(prices);
        return result;
      } catch (error) {
        console.error('[StockPriceHistory] ERROR Failed to bulk add prices', error);
        throw error;
      }
    },

    async getByCodeAndDate(code: string, date: string) {
      try {
        const result = await db.prices
          .where('code')
          .equals(code)
          .and(record => record.date === date)
          .toArray();
        return result;
      } catch (error) {
        console.error(`[StockPriceHistory] ERROR Failed to fetch prices for ${code}`, error);
        throw error;
      }
    },

    async deleteOldRecords(beforeDate: string) {
      try {
        const result = await db.prices.where('date').below(beforeDate).delete();
        return result;
      } catch (error) {
        console.error('[StockPriceHistory] ERROR Failed to clean old records', error);
        throw error;
      }
    },

    async getByCode(code: string, params?: Partial<PriceQueryParams>) {
      try {
        let query = db.prices.where('code').equals(code);
        
        if (params?.startDate && params?.endDate) {
          query = query.and(record => record.date >= params.startDate! && record.date <= params.endDate!);
        } else if (params?.date) {
          query = query.and(record => record.date === params.date!);
        }
        
        const result = await query.toArray();
        return result;
      } catch (error) {
        console.error(`[StockPriceHistory] ERROR Failed to fetch prices for ${code}`, error);
        throw error;
      }
    },

    async clear() {
      try {
        const result = await db.prices.clear();
        return result;
      } catch (error) {
        console.error('[StockPriceHistory] ERROR Failed to clear prices', error);
        throw error;
      }
    }
  };

  // 載入特定股票的歷史資料
  const loadPriceHistory = async (stockCode: string, date?: string) => {
    try {
      const targetDate = date ?? DateUtils.now().format('YYYY-MM-DD');
      
      const history = await priceOps.getByCodeAndDate(stockCode, targetDate);

      priceHistories.value[stockCode] = history;
      return history;
    } catch (error) {
      console.error('[StockPriceHistory] ERROR 載入價格歷史失敗:', error);
      return [];
    }
  };

  // 儲存價格歷史
  const savePriceHistory = async (stockInfos: StockInfo[]) => {
    try {
      const now = DateUtils.now();

      const priceRecords = stockInfos.map(stock => ({
        code: stock.code,
        time: now.format('HH:mm:ss'),
        price: stock.currentPrice,
        volume: stock.volume,
        date: now.format('YYYY-MM-DD')
      }));

      // 儲存到 Dexie
      await priceOps.bulkAdd(priceRecords);

      // 更新本地歷史資料
      priceRecords.forEach(record => {
        if (!priceHistories.value[record.code]) {
          priceHistories.value[record.code] = [];
        }
        priceHistories.value[record.code].push(record);
      });

    } catch (error) {
      console.error('[StockPriceHistory] ERROR 儲存價格歷史失敗:', error);
    }
  };

  // 取得股票當日走勢
  const getStockTrend = (stockCode: string, currentStock: StockInfo) => {
    const history = priceHistories.value[stockCode] || [];
    
    if (!currentStock) return null;

    return {
      stock: currentStock,
      history: history.sort((a, b) => a.time.localeCompare(b.time)),
      hasHistory: history.length > 0
    };
  };

  return {
    loading,
    error,
    priceHistories,
    loadPriceHistory,
    savePriceHistory,
    getStockTrend
  };
}