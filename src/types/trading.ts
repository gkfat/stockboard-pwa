import { TradeDirection } from '@/enums/trade-direction';

// 交易紀錄
export interface TradeRecord {
  id?: string;                // 唯一識別碼
  ticker: string;             // 股票代號
  traded_at: string;          // 交易時間 (ISO string)
  direction: TradeDirection;  // 買賣方向
  price: number;              // 成交價格
  quantity: number;           // 成交數量
  tax: number;                // 交易稅 (賣出才有)
  fee: number;                // 手續費
  created_at?: string;        // 建立時間
  updated_at?: string;        // 更新時間
}

// 股票持倉統計
export interface StockPosition {
  ticker: string;             // 股票代號
  stockName: string;          // 股票名稱
  totalBuyQuantity: number;   // 總買入數量
  totalSellQuantity: number;  // 總賣出數量
  holdingQuantity: number;    // 持有數量
  avgBuyPrice: number;        // 平均買入價
  totalBuyAmount: number;     // 總買入金額 (含手續費)
  totalSellAmount: number;    // 總賣出金額 (扣除手續費和稅)
  totalSoldCost: number;      // 已賣出股票的原始成本 (用於計算已實現績效)
  realizedPnL: number;        // 已實現損益
  unrealizedPnL: number;      // 未實現損益
  currentPrice: number;       // 目前股價
  marketValue: number;        // 目前市值
  totalFees: number;          // 總手續費
  totalTax: number;           // 總交易稅
}

// 總損益統計
export interface TotalPnL {
  totalRealizedPnL: number;   // 總已實現損益
  totalUnrealizedPnL: number; // 總未實現損益
  totalPnL: number;           // 總損益
  totalInvestment: number;    // 總投資金額
  currentMarketValue: number; // 目前總市值
  totalFees: number;          // 總手續費
  totalTax: number;           // 總交易稅
}

// 台灣股票交易費用計算參數
export interface TradingFeeParams {
  price: number;              // 股價
  quantity: number;           // 數量
  direction: TradeDirection;  // 買賣方向
}

// 台灣股票交易費用結果
export interface TradingFeeResult {
  fee: number;                // 手續費
  tax: number;                // 交易稅
  totalCost: number;          // 總成本
}

// 交易摘要結果 (用於 UI 顯示)
export interface TradingSummaryResult {
  fee: string;                // 格式化手續費
  tax: string;                // 格式化交易稅
  total: string;              // 格式化總金額
  totalValue: number;         // 原始總金額數值
}