import { TradeDirection } from '@/enums/trade-direction';
import { TradingFeeParams, TradingFeeResult } from '@/types/trading';

/**
 * 台灣股票交易費用計算器
 * 根據台灣股市規則計算手續費和交易稅
 */
export class TradingCalculator {
  // 台灣股票交易費用參數
  private static readonly FEE_RATE = 0.001425;  // 手續費率 0.1425%
  private static readonly TAX_RATE = 0.003;     // 證券交易稅率 0.3%
  private static readonly MIN_FEE = 20;         // 最低手續費 NT$20

  /**
   * 計算交易費用
   */
  static calculateTradingFee(params: TradingFeeParams): TradingFeeResult {
    const { price, quantity, direction } = params;
    const amount = price * quantity; // 直接以股數計算

    // 計算手續費 (價位*數量*0.1425/100)
    const rawFee = amount * this.FEE_RATE;
    
    const fee = Math.max(Math.floor(rawFee), this.MIN_FEE);

    // 計算交易稅 (只有賣出才有)
    const tax = direction === TradeDirection.SELL ? Math.floor(amount * this.TAX_RATE) : 0;

    // 總成本
    const totalCost = direction === TradeDirection.BUY
      ? amount + fee           // 買入：金額 + 手續費
      : amount - fee - tax;    // 賣出：金額 - 手續費 - 交易稅

    return {
      fee,
      tax,
      totalCost
    };
  }

  /**
   * 計算預估手續費和稅 (用於 UI 顯示)
   */
  static estimateFees(price: number, quantity: number, direction: TradeDirection): TradingFeeResult {
    return this.calculateTradingFee({ price, quantity, direction });
  }

  /**
   * 計算平均買入價
   */
  static calculateAverageBuyPrice(
    currentQuantity: number,
    currentAvgPrice: number,
    newQuantity: number,
    newPrice: number
  ): number {
    if (currentQuantity === 0) return newPrice;
    
    const totalAmount = (currentQuantity * currentAvgPrice) + (newQuantity * newPrice);
    const totalQuantity = currentQuantity + newQuantity;
    
    return totalAmount / totalQuantity;
  }

  /**
   * 計算已實現損益 (FIFO 方式)
   */
  static calculateRealizedPnL(
    sellPrice: number,
    sellQuantity: number,
    avgBuyPrice: number,
    sellFee: number,
    sellTax: number
  ): number {
    const sellAmount = sellPrice * sellQuantity;
    const buyAmount = avgBuyPrice * sellQuantity;
    
    return sellAmount - buyAmount - sellFee - sellTax;
  }

  /**
   * 計算未實現損益
   */
  static calculateUnrealizedPnL(
    currentPrice: number,
    holdingQuantity: number,
    avgBuyPrice: number
  ): number {
    if (holdingQuantity === 0) return 0;
    
    const currentValue = currentPrice * holdingQuantity;
    const costValue = avgBuyPrice * holdingQuantity;
    
    return currentValue - costValue;
  }
}