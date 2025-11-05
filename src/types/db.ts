/**
 * IndexedDB 資料庫型別定義
 */

/**
 * 資料庫型別辨識
 */
export type DbType = 'watchlist' | 'prices';

/**
 * 觀察清單
 */
export interface WatchListItem {
  code: string; // 股票代號，主鍵
  name: string; // 股票名稱
  index: number; // 排序索引
}

/**
 * 股票價格記錄
 */
export interface HistoryPrice {
  id?: number; // 自動遞增主鍵
  code: string; // 股票代號
  date: string; // 日期，格式：YYYY-MM-DD
  time: string; // 時間
  price: number; // 價格
  volume: number; // 成交量
}

/**
 * 資料庫操作結果型別
 */
export interface DBOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  type?: DbType; // 標識操作的資料庫類型
}

/**
 * 查詢參數型別
 */
export interface PriceQueryParams {
  code: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Watchlist 查詢參數
 */
export interface WatchlistQueryParams {
  codes?: string[];
  nameFilter?: string;
}

/**
 * 資料庫表格型別對應
 */
export interface DbTableTypes {
  watchlist: WatchListItem;
  prices: HistoryPrice;
}

/**
 * 資料庫操作方法型別
 */
export interface DbOperations<T extends DbType> {
  add: (data: DbTableTypes[T]) => Promise<unknown>;
  get: (key: string | number) => Promise<DbTableTypes[T] | undefined>;
  getAll: () => Promise<DbTableTypes[T][]>;
  update: (key: string | number, data: Partial<DbTableTypes[T]>) => Promise<number>;
  delete: (key: string | number) => Promise<void>;
  clear: () => Promise<void>;
}