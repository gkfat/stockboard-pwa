import { TradeDirection } from '@/enums/trade-direction';
import { TradingCalculator } from '@/utils/tradingCalculator';
import type { TradeRecord, StockPosition, TotalPnL } from '@/types/trading';
import type { ProcessedStockInfo } from '@/types/twse-api';

/**
 * PnL (損益) 計算工具類
 * 統一管理所有損益相關計算邏輯
 */
export class PnLUtil {
  /**
   * 取得損益顏色 (台灣股市習慣：紅漲綠跌)
   * @param amount 損益金額
   * @returns CSS 顏色類別
   */
  static getPnLColor(amount: number): string {
    if (amount > 0) return 'text-error'; // 獲利紅色
    if (amount < 0) return 'text-success'; // 虧損綠色
    return 'text-grey';
  }
  
  /**
   * 計算股票持倉統計
   * @param trades 交易紀錄陣列
   * @param stockPrices 股票即時價格資料
   * @returns 股票持倉陣列
   */
  static calculatePositions(
    trades: TradeRecord[], 
    stockPrices: Record<string, ProcessedStockInfo>
  ): StockPosition[] {
    const positionMap = new Map<string, StockPosition>();

    // 第一階段：處理所有交易紀錄
    trades.forEach(trade => {
      const ticker = trade.ticker;

      if (!positionMap.has(ticker)) {
        const stockInfo = stockPrices[ticker];
        positionMap.set(ticker, {
          ticker,
          stockName: stockInfo?.name || ticker,
          totalBuyQuantity: 0,
          totalSellQuantity: 0,
          holdingQuantity: 0,
          avgBuyPrice: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
          totalSoldCost: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          currentPrice: stockInfo?.currentPrice || 0,
          marketValue: 0,
          totalFees: 0,
          totalTax: 0
        });
      }

      const position = positionMap.get(ticker)!;
      
      // 累計手續費和稅
      position.totalFees += trade.fee;
      position.totalTax += trade.tax;

      if (trade.direction === TradeDirection.BUY) {
        // 買入處理
        this.processBuyTrade(position, trade);
      } else {
        // 賣出處理
        this.processSellTrade(position, trade);
      }
    });

    // 第二階段：計算最終數據
    const result: StockPosition[] = [];
    positionMap.forEach(position => {
      this.finalizePosition(position, stockPrices[position.ticker]);
      result.push(position);
    });

    return result;
  }

  /**
   * 處理買入交易
   */
  private static processBuyTrade(position: StockPosition, trade: TradeRecord): void {
    const tradeAmount = trade.price * trade.quantity;
    const tradeTotalCost = tradeAmount + trade.fee; // 買入成本包含手續費

    // 更新平均買入價 (加權平均，包含手續費)
    if (position.totalBuyQuantity === 0) {
      // 第一次買入：平均價 = (股價 * 數量 + 手續費) / 數量
      position.avgBuyPrice = tradeTotalCost / trade.quantity;
    } else {
      // 後續買入：加權平均
      const currentTotalCost = position.totalBuyAmount;
      const newTotalCost = currentTotalCost + tradeTotalCost;
      const newTotalQuantity = position.totalBuyQuantity + trade.quantity;
      position.avgBuyPrice = newTotalCost / newTotalQuantity;
    }

    position.totalBuyQuantity += trade.quantity;
    position.totalBuyAmount += tradeTotalCost;
  }

  /**
   * 處理賣出交易
   */
  private static processSellTrade(position: StockPosition, trade: TradeRecord): void {
    position.totalSellQuantity += trade.quantity;
    
    // 賣出金額 = 股價 * 數量 - 手續費 - 交易稅
    const sellAmount = (trade.price * trade.quantity) - trade.fee - trade.tax;
    position.totalSellAmount += sellAmount;

    // 計算此次賣出股票的原始成本 (以平均買入價計算)
    const soldCost = position.avgBuyPrice * trade.quantity;
    position.totalSoldCost += soldCost;

    // 計算已實現損益 (FIFO)
    const realizedPnL = this.calculateRealizedPnL(
      trade.price,
      trade.quantity,
      position.avgBuyPrice,
      trade.fee,
      trade.tax
    );
    position.realizedPnL += realizedPnL;
  }

  /**
   * 完成持倉計算
   */
  private static finalizePosition(
    position: StockPosition, 
    stockInfo?: ProcessedStockInfo
  ): void {
    // 更新目前股價和股票名稱（如果有更新的資料）
    if (stockInfo?.currentPrice) {
      position.currentPrice = stockInfo.currentPrice;
    }
    if (stockInfo?.name && stockInfo.name !== position.ticker) {
      position.stockName = stockInfo.name;
    }

    // 計算持有數量
    position.holdingQuantity = position.totalBuyQuantity - position.totalSellQuantity;

    // 計算未實現損益和市值
    if (position.holdingQuantity > 0) {
      const { unrealizedPnL, marketValue } = this.calculateUnrealizedPnL(
        position.currentPrice,
        position.holdingQuantity,
        position.avgBuyPrice
      );
      
      position.unrealizedPnL = unrealizedPnL;
      position.marketValue = marketValue;
    } else {
      position.unrealizedPnL = 0;
      position.marketValue = 0;
    }
  }

  /**
   * 計算已實現損益
   * 公式：(賣出價 * 數量) - (平均買入價 * 數量) - 手續費 - 交易稅
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
   * 計算未實現損益 (含預估賣出費用)
   * 公式：(目前價 * 持有數量) - (平均買入價 * 持有數量) - 預估賣出費用
   */
  static calculateUnrealizedPnL(
    currentPrice: number,
    holdingQuantity: number,
    avgBuyPrice: number
  ): { unrealizedPnL: number; marketValue: number } {
    if (holdingQuantity <= 0) {
      return { unrealizedPnL: 0, marketValue: 0 };
    }

    const marketValue = currentPrice * holdingQuantity;
    const costValue = avgBuyPrice * holdingQuantity;
    const rawUnrealizedPnL = marketValue - costValue;

    // 計算預估賣出費用
    const estimatedSellFees = TradingCalculator.estimateFees(
      currentPrice,
      holdingQuantity,
      TradeDirection.SELL
    );

    // 扣除預估賣出費用
    const unrealizedPnL = rawUnrealizedPnL - estimatedSellFees.fee - estimatedSellFees.tax;

    return { unrealizedPnL, marketValue };
  }

  /**
   * 計算總損益統計
   */
  static calculateTotalPnL(positions: StockPosition[]): TotalPnL {
    const result: TotalPnL = {
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      totalPnL: 0,
      totalInvestment: 0,
      currentMarketValue: 0,
      totalFees: 0,
      totalTax: 0
    };

    positions.forEach(position => {
      result.totalRealizedPnL += position.realizedPnL;
      result.totalUnrealizedPnL += position.unrealizedPnL;
      result.totalInvestment += position.totalBuyAmount;
      result.currentMarketValue += position.marketValue;
      result.totalFees += position.totalFees;
      result.totalTax += position.totalTax;
    });

    result.totalPnL = result.totalRealizedPnL + result.totalUnrealizedPnL;

    return result;
  }

  /**
   * 計算績效百分比
   */
  static calculatePerformancePercentage(pnl: number, investment: number): number {
    if (investment === 0) return 0;
    return (pnl / investment) * 100;
  }

  /**
   * 計算已實現績效百分比 (基於持倉成本)
   * 公式：已實現損益 / 已賣出股票的原始成本 * 100
   */
  static calculateRealizedPerformancePercentage(
    realizedPnL: number,
    totalSoldCost: number
  ): number {
    if (totalSoldCost === 0) return 0;
    return (realizedPnL / totalSoldCost) * 100;
  }

  /**
   * 計算未實現績效百分比 (基於持倉成本)
   * 公式：未實現損益 / 持倉成本 * 100
   */
  static calculateUnrealizedPerformancePercentage(
    currentPrice: number,
    holdingQuantity: number,
    avgBuyPrice: number
  ): number {
    if (holdingQuantity <= 0 || avgBuyPrice <= 0) return 0;
    
    const costValue = avgBuyPrice * holdingQuantity;
    const marketValue = currentPrice * holdingQuantity;
    const unrealizedPnL = marketValue - costValue;
    
    return (unrealizedPnL / costValue) * 100;
  }

  /**
   * 計算總績效百分比 (基於總投資成本)
   * 公式：總損益 / 總投資成本 * 100
   */
  static calculateTotalPerformancePercentage(
    totalPnL: number,
    totalInvestment: number
  ): number {
    if (totalInvestment === 0) return 0;
    return (totalPnL / totalInvestment) * 100;
  }

  /**
   * 計算總已實現績效百分比
   * 公式：總已實現損益 / 總賣出成本 * 100
   */
  static calculateTotalRealizedPerformancePercentage(
    totalRealizedPnL: number,
    positions: StockPosition[]
  ): number {
    const totalSoldCost = positions.reduce((sum, position) => sum + position.totalSoldCost, 0);
    if (totalSoldCost === 0) return 0;
    
    return (totalRealizedPnL / totalSoldCost) * 100;
  }

  /**
   * 計算總未實現績效百分比
   * 公式：(總現值 - 總持倉成本) / 總持倉成本 * 100
   */
  static calculateTotalUnrealizedPerformancePercentage(
    positions: StockPosition[]
  ): number {
    let totalCostOfHoldings = 0;
    let totalCurrentValue = 0;
    
    positions.forEach(position => {
      if (position.holdingQuantity > 0) {
        totalCostOfHoldings += position.avgBuyPrice * position.holdingQuantity;
        totalCurrentValue += position.marketValue;
      }
    });
    
    if (totalCostOfHoldings === 0) return 0;
    
    const unrealizedPnL = totalCurrentValue - totalCostOfHoldings;
    return (unrealizedPnL / totalCostOfHoldings) * 100;
  }
}