// TWSE API 請求參數
export interface TWStockApiRequest {
  ex_ch: string; // 交易所代碼，例如 'tse_2330.tw'
}

// TWSE API 原始回應
export interface TWStockApiResponse {
  msgArray: TWStockData[];
  referer: string;
  userDelay: number;
  rtcode: string;
  queryTime: {
    sysDate: string;
    sysTime: string;
    showChart: boolean;
    sessionStr: string;
    sysDateTime: string;
    behaviorCount: number;
    stockInfoItem: number;
    stockInfo: string;
  };
}

// TWSE 股票資料原始格式
export interface TWStockData {
  c: string;  // 股票代號
  n: string;  // 股票名稱
  z: string;  // 現價
  y: string;  // 昨收
  o: string;  // 開盤價
  h: string;  // 最高價
  l: string;  // 最低價
  v: string;  // 成交量
  tv: string; // 總成交量
  a: string;  // 最佳五檔賣價
  b: string;  // 最佳五檔買價
  f: string;  // 最佳五檔賣量
  g: string;  // 最佳五檔買量
  d: string;  // 最近交易日期
  t: string;  // 最近交易時間
  ip: string; // 漲停價
  w: string;  // 跌停價
  u: string;  // 漲跌
  s: string;  // 成交筆數
  p: string;  // 漲跌幅
  tlong: string; // 長時間戳
  ex: string; // 交易所
  ch: string; // 頻道
  nf: string; // 名稱全稱
  i: string;  // 產業類別
}

// 處理後的股票資訊
export interface ProcessedStockInfo {
  code: string;           // 股票代號
  name: string;           // 股票名稱
  currentPrice: number;   // 現價
  yesterdayPrice: number; // 昨收
  openPrice: number;      // 開盤價
  highPrice: number;      // 最高價
  lowPrice: number;       // 最低價
  change: number;         // 漲跌金額
  changePercent: number;  // 漲跌幅
  volume: number;         // 成交量
  totalVolume: number;    // 總成交量
  tradingDate: string;    // 交易日期
  tradingTime: string;    // 交易時間
  timestamp: number;      // 更新時間 (timestamp long)
}

// API 錯誤回應
export interface TWStockApiError {
  message: string;
  code?: string;
  status?: number;
}