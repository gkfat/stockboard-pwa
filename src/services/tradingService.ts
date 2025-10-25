import { TradeDirection } from '@/enums/trade-direction';
import { TradingCostUtil } from '@/utils/tradingCostUtil';
import { formatCurrency } from '@/utils/formatUtil';
import type { TradingFeeParams, TradingFeeResult, TradingSummaryResult } from '@/types/trading';

/**
 * 交易服務
 * 負責交易相關的業務邏輯和 UI 交互
 */
export class TradingService {

  /**
   * 計算交易費用
   */
  static calculateTradingFee(params: TradingFeeParams): TradingFeeResult {
    const { price, quantity, direction } = params;
    
    const costs = TradingCostUtil.calculateTaiwanTradingCosts(
      price, 
      quantity, 
      direction
    );

    return {
      fee: costs.brokerageFee,
      tax: costs.tax,
      totalCost: costs.netAmount
    };
  }

  /**
   * 計算預估手續費和稅 (用於 UI 顯示)
   */
  static estimateFees(price: number, quantity: number, direction: TradeDirection): TradingFeeResult {
    return this.calculateTradingFee({ price, quantity, direction });
  }

  /**
   * 計算交易摘要 (用於 AddTradeDialog 顯示)
   * 包含使用者自訂費用的邏輯處理
   */
  static calculateTradingSummary(
    price: number,
    quantity: number,
    direction: TradeDirection,
    userFee?: number | string | null,
    userTax?: number | string | null
  ): TradingSummaryResult {
    // 驗證輸入
    if (!price || !quantity || price <= 0 || quantity <= 0) {
      return {
        fee: formatCurrency(0),
        tax: formatCurrency(0),
        total: formatCurrency(0),
        totalValue: 0
      };
    }

    // 計算預設費用
    const defaultFees = this.calculateTradingFee({ price, quantity, direction });

    // 決定使用的手續費：使用者輸入值或預設計算值
    const actualFee = (userFee !== '' && userFee !== null && userFee !== undefined)
      ? parseFloat(userFee.toString())
      : defaultFees.fee;

    // 決定使用的交易稅：使用者輸入值或預設計算值
    const actualTax = (userTax !== '' && userTax !== null && userTax !== undefined)
      ? parseFloat(userTax.toString())
      : defaultFees.tax;

    const amount = price * quantity;
    let total = 0;

    if (direction === TradeDirection.BUY) {
      // 買入：金額 + 手續費
      total = amount + actualFee;
    } else {
      // 賣出：金額 - 手續費 - 交易稅
      total = amount - actualFee - actualTax;
    }

    return {
      fee: formatCurrency(actualFee),
      tax: formatCurrency(actualTax),
      total: formatCurrency(total),
      totalValue: total
    };
  }

}