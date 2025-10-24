export interface StockInfo {
  code: string       // 股票代號 (2330)
  name: string       // 股票名稱 (台積電)
  price: number      // 最新成交價
  change: number     // 漲跌
  changePercent: number // 漲跌幅百分比
  volume: number     // 成交量
  updatedAt: string  // 更新時間
}

export interface PriceHistory {
  id?: number
  code: string
  time: string       // "13:25:00"
  price: number
  volume: number
  date: string       // "2024-01-15"
}
