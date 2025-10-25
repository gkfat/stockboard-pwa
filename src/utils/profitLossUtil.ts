/**
 * 計算初始成本
 * 公式：(買入價格 × 數量) + 買入手續費 + 稅金 + 其他成本
 */
export const calculateInitialCost = (
  buyPrice: number,
  quantity: number,
  buyFee: number,
  buyTax = 0,
  otherCosts = 0
): number => {
  return (buyPrice * quantity) + buyFee + buyTax + otherCosts;
};

/**
 * 計算當前價值
 * 公式：當前價格 × 數量
 */
export const calculateCurrentValue = (
  currentPrice: number,
  quantity: number
): number => {
  return currentPrice * quantity;
};

/**
 * 計算損益
 * 公式：當前價值 − 初始成本
 */
export const calculateProfitLoss = (
  currentValue: number,
  initialCost: number
): number => {
  return currentValue - initialCost;
};

/**
 * 計算損益率
 * 公式：損益 ÷ 初始成本
 */
export const calculateProfitLossRate = (
  profitLoss: number,
  initialCost: number
): number => {
  if (initialCost === 0) return 0;
  return profitLoss / initialCost;
};

/**
 * 計算損益率百分比
 * 公式：損益率 × 100
 */
export const calculateProfitLossPercentage = (
  profitLoss: number,
  initialCost: number
): number => {
  return calculateProfitLossRate(profitLoss, initialCost) * 100;
};

/**
 * 計算已實現損益
 * 公式：(賣出價格 × 數量) - (買入成本) - 賣出手續費 - 賣出稅金
 */
export const calculateRealizedPnL = (
  sellPrice: number,
  sellQuantity: number,
  avgBuyPrice: number,
  sellFee: number,
  sellTax: number
): number => {
  const sellRevenue = sellPrice * sellQuantity;
  const buyCost = avgBuyPrice * sellQuantity;
  return sellRevenue - buyCost - sellFee - sellTax;
};

/**
 * 計算未實現損益
 * 公式：(當前價格 × 持有數量) - (平均買入價 × 持有數量)
 */
export const calculateUnrealizedPnL = (
  currentPrice: number,
  holdingQuantity: number,
  avgBuyPrice: number
): number => {
  if (holdingQuantity <= 0) return 0;
  const currentValue = currentPrice * holdingQuantity;
  const costValue = avgBuyPrice * holdingQuantity;
  return currentValue - costValue;
};

/**
 * 計算未實現損益 (含預估賣出成本)
 * 公式：未實現損益 - 預估賣出手續費 - 預估賣出稅金
 */
export const calculateUnrealizedPnLWithCosts = (
  currentPrice: number,
  holdingQuantity: number,
  avgBuyPrice: number,
  estimatedSellFee: number,
  estimatedSellTax: number
): { unrealizedPnL: number; marketValue: number; grossUnrealizedPnL: number } => {
  if (holdingQuantity <= 0) {
    return { unrealizedPnL: 0, marketValue: 0, grossUnrealizedPnL: 0 };
  }

  const marketValue = currentPrice * holdingQuantity;
  const costValue = avgBuyPrice * holdingQuantity;
  const grossUnrealizedPnL = marketValue - costValue;
  const unrealizedPnL = grossUnrealizedPnL - estimatedSellFee - estimatedSellTax;

  return { unrealizedPnL, marketValue, grossUnrealizedPnL };
};

/**
 * 損益計算工具集合
 * 提供統一的匯出介面
 */
export const ProfitLossUtil = {
  calculateInitialCost,
  calculateCurrentValue,
  calculateProfitLoss,
  calculateProfitLossRate,
  calculateProfitLossPercentage,
  calculateRealizedPnL,
  calculateUnrealizedPnL,
  calculateUnrealizedPnLWithCosts
} as const;

// 預設匯出
export default ProfitLossUtil;