import Dexie, { Table } from 'dexie';
import type { WatchListItem, StockPrice } from '@/types/db';
import type { TradeRecord } from '@/types/trading';

// DB 操作 Logger
class DBLogger {
  private prefix = '[StockDB]';
  
  log(operation: string, data?: any) {
    console.log(`${this.prefix} ${operation}`, data || '');
  }
  
  error(operation: string, error: any) {
    console.error(`${this.prefix} ERROR ${operation}`, error);
  }
}

const logger = new DBLogger();

export class StockDB extends Dexie {
  watchlist!: Table<WatchListItem, string>;
  prices!: Table<StockPrice, number>;
  trades!: Table<TradeRecord, string>;

  constructor() {
    super('StockDB');
    this.version(1).stores({
      watchlist: '&code, name',
      prices: '++id, code, time, date'
    });
    
    // 新增交易記錄表格
    this.version(2).stores({
      watchlist: '&code, name',
      prices: '++id, code, time, date',
      trades: '++id, ticker, traded_at, direction, created_at'
    });
    
    // 新增 index 欄位到 watchlist
    this.version(3).stores({
      watchlist: '&code, name, index',
      prices: '++id, code, time, date',
      trades: '++id, ticker, traded_at, direction, created_at'
    }).upgrade(tx => {
      // 為現有記錄添加 index 欄位
      let index = 0;
      return tx.table('watchlist').toCollection().modify((record: WatchListItem) => {
        if (record.index === undefined) {
          record.index = index++;
        }
      });
    });
    
    // 簡單的初始化日誌
    logger.log('Database initialized');
  }
  
  // 手動檢查資料庫是否就緒
  async checkReady() {
    try {
      await this.open();
      return true;
    } catch (error) {
      logger.error('Database open failed', error);
      return false;
    }
  }
}

// DB 實例
export const db = new StockDB();

