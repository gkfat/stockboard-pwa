export interface StockInfo {
  code: string;       // 股票代號 (2330)
  name: string;       // 股票名稱 (台積電)
  currentPrice: number;      // 最新成交價
  change: number;     // 漲跌
  changePercent: number; // 漲跌幅百分比
  volume: number; // 成交量 
  totalVolume: number;    // 總成交量
  tradingDate: string; // API 交易日期 (YYYY-MM-DD)
  tradingTime: string; // API 交易時間 (HH:mm:ss)
  updatedAt: string;  // 更新時間 (ISO 格式)
  highPrice: number; // 最高價格
  lowPrice: number; // 最低價格
  openPrice: number; // 開盤價
  yesterdayPrice: number; // 昨收
}

export interface PriceHistory {
  id?: number;
  code: string;
  time: string;       // "13:25:00"
  price: number;
  volume: number;
  date: string;       // "2024-01-15"
}
