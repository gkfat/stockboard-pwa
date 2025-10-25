import { TradeDirection } from '@/enums/trade-direction';
import { TAIWAN_STOCK_MARKET, UI_COLORS } from '@/constants';

/**
 * 計算台灣股市手續費
 * 公式：交易金額 × 0.1425%，最低 NT$20
 */
export const calculateTaiwanBrokerageFee = (
  price: number,
  quantity: number,
  customRate?: number
): number => {
  const amount = price * quantity;
  const rate = customRate || TAIWAN_STOCK_MARKET.FEE_RATE;
  const rawFee = amount * rate;
  return Math.max(Math.floor(rawFee), TAIWAN_STOCK_MARKET.MIN_FEE);
};

/**
 * 計算台灣股市證券交易稅
 * 公式：賣出金額 × 0.3% (僅賣出時收取)
 */
export const calculateTaiwanSecuritiesTransactionTax = (
  price: number,
  quantity: number,
  direction: TradeDirection,
  customRate?: number
): number => {
  if (direction !== TradeDirection.SELL) return 0;
  
  const amount = price * quantity;
  const rate = customRate || TAIWAN_STOCK_MARKET.TAX_RATE;
  return Math.floor(amount * rate);
};

/**
 * 計算台灣股市完整交易成本
 */
export const calculateTaiwanTradingCosts = (
  price: number,
  quantity: number,
  direction: TradeDirection,
  customFeeRate?: number,
  customTaxRate?: number
): {
  brokerageFee: number;
  tax: number;
  totalCost: number;
  netAmount: number; // 買入時為總支出，賣出時為淨收入
} => {
  const amount = price * quantity;
  const brokerageFee = calculateTaiwanBrokerageFee(price, quantity, customFeeRate);
  const tax = calculateTaiwanSecuritiesTransactionTax(price, quantity, direction, customTaxRate);
  const totalCost = brokerageFee + tax;
  
  const netAmount = direction === TradeDirection.BUY 
    ? amount + brokerageFee + tax  // 買入總支出
    : amount - brokerageFee - tax; // 賣出淨收入
  
  return {
    brokerageFee,
    tax,
    totalCost,
    netAmount
  };
};

/**
 * 預估賣出成本 (用於未實現損益計算)
 */
export const estimateSellCosts = (
  currentPrice: number,
  quantity: number
): {
  estimatedFee: number;
  estimatedTax: number;
  estimatedTotalCost: number;
} => {
  const estimatedFee = calculateTaiwanBrokerageFee(currentPrice, quantity);
  const estimatedTax = calculateTaiwanSecuritiesTransactionTax(
    currentPrice, 
    quantity, 
    TradeDirection.SELL
  );
  const estimatedTotalCost = estimatedFee + estimatedTax;
  
  return {
    estimatedFee,
    estimatedTax,
    estimatedTotalCost
  };
};

/**
 * 取得損益顏色 (台灣股市習慣：紅漲綠跌)
 */
export const getPnLColor = (amount: number): string => {
  if (amount > 0) return UI_COLORS.PROFIT; // 獲利紅色
  if (amount < 0) return UI_COLORS.LOSS; // 虧損綠色
  return UI_COLORS.NEUTRAL;
};

/**
 * 交易成本計算工具集合
 * 提供統一的匯出介面
 */
export const TradingCostUtil = {
  calculateTaiwanBrokerageFee,
  calculateTaiwanSecuritiesTransactionTax,
  calculateTaiwanTradingCosts,
  estimateSellCosts,
  getPnLColor
} as const;

// 預設匯出
export default TradingCostUtil;