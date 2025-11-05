/**
 * 通用格式化工具函式
 * 整合專案中的各種數據格式化需求
 */

/**
 * 格式化價格 - 顯示到小數點第二位
 * @param price 價格數值
 * @param withCurrency 是否顯示貨幣符號，預設為 true
 * @returns 格式化的價格字串
 */
export const formatPrice = (price: number): string => {
  try {
    return price.toFixed(2);
  } catch {
    return 'N/A';
  }
};

/**
 * 格式化貨幣 - 台幣格式，無小數位
 * @param amount 金額數值
 * @returns 格式化的貨幣字串
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * 格式化貨幣 - 台幣格式，保留小數位
 * @param amount 金額數值
 * @param fractionDigits 小數位數，預設為 0
 * @returns 格式化的貨幣字串
 */
export const formatCurrencyWithDecimal = (amount: number, fractionDigits = 0): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
};

/**
 * 格式化百分比 - 顯示正負號和 % 符號
 * @param percentage 百分比數值
 * @param decimalPlaces 小數位數，預設為 2
 * @returns 格式化的百分比字串
 */
export const formatPercentage = (percentage: number, decimalPlaces = 2): string => {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimalPlaces)}%`;
};

/**
 * 格式化漲跌幅 - 顯示正負號
 * @param change 漲跌數值
 * @param decimalPlaces 小數位數，預設為 2
 * @returns 格式化的漲跌字串
 */
export const formatChange = (change: number, decimalPlaces = 2): string => {
  return change.toFixed(decimalPlaces);
};

/**
 * 格式化數字 - 千分位分隔符
 * @param num 數值
 * @param decimalPlaces 小數位數，預設為 0
 * @returns 格式化的數字字串
 */
export const formatNumber = (num: number, decimalPlaces = 0): string => {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(num);
};

/**
 * 格式化股票數量 - 添加「股」單位
 * @param quantity 股數
 * @returns 格式化的股數字串
 */
export const formatQuantity = (quantity: number): string => {
  return `${formatNumber(quantity)} 股`;
};

/**
 * 格式化工具集合
 * 提供統一的匯出介面
 */
export const FormatUtil = {
  formatPrice,
  formatCurrency,
  formatCurrencyWithDecimal,
  formatPercentage,
  formatChange,
  formatNumber,
  formatQuantity
} as const;

// 預設匯出
export default FormatUtil;