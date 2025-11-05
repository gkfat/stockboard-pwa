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
      loading.value = true;
      error.value = null;

      clearOldData();

      const priceRecords = stockInfos.map(stock => {
        const d = DateUtils.createDate(stock.updatedAt);

        return {
          code: stock.code,
          date: d.format('YYYY-MM-DD'),
          time: d.format('HH:mm:ss'),
          price: stock.currentPrice,
          volume: stock.volume || 0
        };
      });

      // 過濾重複資料：檢查相同 date & time & code 的記錄
      const uniqueRecords: HistoryPrice[] = [];
      
      for (const record of priceRecords) {
        const existing = await db.prices
          .where('code').equals(record.code)
          .and(item => item.date === record.date && item.time === record.time)
          .first();

        if (!existing) {
          uniqueRecords.push(record);
        } else {
          console.log(`[StockPriceHistory] 跳過重複資料: ${record.code} ${record.date} ${record.time}`);
        }
      }

      if (uniqueRecords.length > 0) {
        // 儲存到 Dexie (只儲存不重複的記錄)
        await priceOps.bulkAdd(uniqueRecords);
        console.log(`[StockPriceHistory] 成功儲存 ${uniqueRecords.length} 筆價格資料`);

        // 更新本地歷史資料
        uniqueRecords.forEach(record => {
          if (!priceHistories.value[record.code]) {
            priceHistories.value[record.code] = [];
          }
          
          // 檢查本地快取是否已存在
          const localExists = priceHistories.value[record.code].some(
            item => item.date === record.date && item.time === record.time
          );
          
          if (!localExists) {
            priceHistories.value[record.code].push(record);
          }
        });
      } else {
        console.log('[StockPriceHistory] 所有資料均為重複，未儲存新記錄');
      }

      return {
        success: true,
        totalRecords: priceRecords.length,
        savedRecords: uniqueRecords.length,
        skippedDuplicates: priceRecords.length - uniqueRecords.length
      };

    } catch (err) {
      const errorMessage = `儲存價格歷史失敗: ${err}`;
      console.error('[StockPriceHistory] ERROR', errorMessage);
      error.value = errorMessage;
      
      return {
        success: false,
        error: errorMessage,
        totalRecords: stockInfos.length,
        savedRecords: 0,
        skippedDuplicates: 0
      };
    } finally {
      loading.value = false;
    }
  };

  // 清除舊的歷史資料
  const clearOldData = async (cutoffDate?: string) => {
    try {
      loading.value = true;
      error.value = null;

      // 若未傳入日期，則使用前 3 天作為預設值
      const targetDate = cutoffDate || DateUtils.now().subtract(3, 'day').format('YYYY-MM-DD');
      
      console.log(`[StockPriceHistory] 開始清除 ${targetDate} 之前的歷史資料`);
      
      // 使用現有的 deleteOldRecords 方法清除資料庫中的舊資料
      const deletedCount = await priceOps.deleteOldRecords(targetDate);
      
      // 清除記憶體中的歷史資料快取
      Object.keys(priceHistories.value).forEach(stockCode => {
        priceHistories.value[stockCode] = priceHistories.value[stockCode].filter(
          record => record.date >= targetDate
        );
      });
      
      console.log(`[StockPriceHistory] 成功清除 ${deletedCount} 筆 ${targetDate} 之前的歷史資料`);
      
      return {
        success: true,
        deletedCount,
        cutoffDate: targetDate
      };
      
    } catch (err) {
      const errorMessage = `清除歷史資料失敗: ${err}`;
      console.error('[StockPriceHistory] ERROR', errorMessage);
      error.value = errorMessage;
      
      return {
        success: false,
        error: errorMessage,
        cutoffDate: cutoffDate || DateUtils.now().subtract(3, 'day').format('YYYY-MM-DD')
      };
    } finally {
      loading.value = false;
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