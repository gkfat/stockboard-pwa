import Dexie, { Table } from 'dexie';
import type { WatchListItem, HistoryPrice } from '@/types/db';
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
  prices!: Table<HistoryPrice, number>;
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

  // 交易記錄相關方法
  async getAllTrades(): Promise<TradeRecord[]> {
    try {
      logger.log('Getting all trades');
      const trades = await this.trades.orderBy('traded_at').reverse().toArray();
      return trades;
    } catch (error) {
      logger.error('getAllTrades', error);
      throw error;
    }
  }

  async addTrade(tradeData: Omit<TradeRecord, 'id'>): Promise<TradeRecord> {
    try {
      logger.log('Adding trade', tradeData);
      const id = await this.trades.add({
        ...tradeData,
        created_at: new Date().toISOString()
      } as TradeRecord);
      
      const newTrade = await this.trades.get(id);
      if (!newTrade) {
        throw new Error('Failed to retrieve newly added trade');
      }
      
      logger.log('Trade added successfully', newTrade);
      return newTrade;
    } catch (error) {
      logger.error('addTrade', error);
      throw error;
    }
  }

  async getTradesByTicker(ticker: string): Promise<TradeRecord[]> {
    try {
      logger.log('Getting trades by ticker', ticker);
      const trades = await this.trades
        .where('ticker')
        .equals(ticker)
        .toArray();
      
      // 手動排序：按交易時間升序
      return trades.sort((a, b) => 
        new Date(a.traded_at).getTime() - new Date(b.traded_at).getTime()
      );
    } catch (error) {
      logger.error('getTradesByTicker', error);
      throw error;
    }
  }

  async deleteTrade(id: string): Promise<void> {
    try {
      logger.log('Deleting trade', id);
      await this.trades.delete(id);
      logger.log('Trade deleted successfully', id);
    } catch (error) {
      logger.error('deleteTrade', error);
      throw error;
    }
  }
}

// DB 實例
export const db = new StockDB();

