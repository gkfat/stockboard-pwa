/**
 * 應用程式常數定義
 * 統一管理所有數值常數
 */

// 台灣股市費用參數
export const TAIWAN_STOCK_MARKET = {
  /** 手續費率 0.1425% */
  FEE_RATE: 0.001425,
  
  /** 證券交易稅率 0.3% (僅賣出) */
  TAX_RATE: 0.003,
  
  /** 最低手續費 NT$20 */
  MIN_FEE: 20
} as const;

// 快取設定
/** 股票資料快取有效期：30 秒 */
export const INTERVAL_SECONDS = 5 * 1000;

// 時間相關常數
export const TIME_CONSTANTS = {
  /** 一年天數 */
  DAYS_PER_YEAR: 365,
  
  /** 毫秒轉秒 */
  MS_TO_SECONDS: 1000,
  
  /** 秒轉分鐘 */
  SECONDS_TO_MINUTES: 60,
  
  /** 分鐘轉小時 */
  MINUTES_TO_HOURS: 60,
  
  /** 小時轉天 */
  HOURS_TO_DAYS: 24
} as const;

// 台灣股市交易時間
export const TAIWAN_MARKET_TIME = {
  /** 交易開始時間 (分鐘) - 09:00 */
  TRADING_START: 540,
  
  /** 交易結束時間 (分鐘) - 13:30 */
  TRADING_END: 810,
  
  /** 週一 */
  MONDAY: 1,
  
  /** 週五 */
  FRIDAY: 5,
  
  /** 週六 */
  SATURDAY: 6,
  
  /** 週日 */
  SUNDAY: 0,
  
  /** 下午 2 點 */
  AFTERNOON_CUTOFF: 14
} as const;

// UI 顏色常數
export const UI_COLORS = {
  /** 獲利顏色 (台灣股市習慣：紅漲) */
  PROFIT: 'text-error',
  
  /** 虧損顏色 (台灣股市習慣：綠跌) */
  LOSS: 'text-success',
  
  /** 中性顏色 */
  NEUTRAL: 'text-grey'
} as const;

// 匯出所有常數
export const CONSTANTS = {
  TAIWAN_STOCK_MARKET,
  INTERVAL_SECONDS,
  TIME_CONSTANTS,
  TAIWAN_MARKET_TIME,
  UI_COLORS
} as const;

// 預設匯出
export default CONSTANTS;