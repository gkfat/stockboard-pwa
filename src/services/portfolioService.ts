import { TradeDirection } from '@/enums/trade-direction';
import { ProfitLossUtil } from '@/utils/profitLossUtil';
import { TradingCostUtil } from '@/utils/tradingCostUtil';
import type { TradeRecord, StockPosition, TotalPnL } from '@/types/trading';
import type { ProcessedStockInfo } from '@/types/twse-api';

/**
 * 投資組合服務
 * 負責組裝和業務邏輯判斷，使用基本 util 函數
 */
export class PortfolioService {

  /**
   * 計算股票持倉統計
   * 組裝交易記錄成持倉資料
   */
  static calculatePositions(
    trades: TradeRecord[], 
    stockPrices: Record<string, ProcessedStockInfo>
  ): StockPosition[] {
    const positionMap = new Map<string, StockPosition>();

    // 處理所有交易紀錄
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
        this.processBuyTrade(position, trade);
      } else {
        this.processSellTrade(position, trade);
      }
    });

    // 完成最終計算
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
    const initialCost = ProfitLossUtil.calculateInitialCost(
      trade.price,
      trade.quantity,
      trade.fee,
      trade.tax
    );

    // 更新平均買入價 (包含所有成本的加權平均)
    if (position.totalBuyQuantity === 0) {
      position.avgBuyPrice = initialCost / trade.quantity;
    } else {
      const currentTotalCost = position.totalBuyAmount;
      const newTotalCost = currentTotalCost + initialCost;
      const newTotalQuantity = position.totalBuyQuantity + trade.quantity;
      position.avgBuyPrice = newTotalCost / newTotalQuantity;
    }

    position.totalBuyQuantity += trade.quantity;
    position.totalBuyAmount += initialCost;
  }

  /**
   * 處理賣出交易
   */
  private static processSellTrade(position: StockPosition, trade: TradeRecord): void {
    position.totalSellQuantity += trade.quantity;
    
    // 賣出淨收入
    const sellNetRevenue = (trade.price * trade.quantity) - trade.fee - trade.tax;
    position.totalSellAmount += sellNetRevenue;

    // 計算此次賣出股票的原始成本
    const soldCost = position.avgBuyPrice * trade.quantity;
    position.totalSoldCost += soldCost;

    // 計算已實現損益
    const realizedPnL = ProfitLossUtil.calculateRealizedPnL(
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
    // 更新股價和名稱
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
      // 預估賣出成本
      const sellCosts = TradingCostUtil.estimateSellCosts(
        position.currentPrice,
        position.holdingQuantity
      );

      // 計算未實現損益
      const { unrealizedPnL, marketValue } = ProfitLossUtil.calculateUnrealizedPnLWithCosts(
        position.currentPrice,
        position.holdingQuantity,
        position.avgBuyPrice,
        sellCosts.estimatedFee,
        sellCosts.estimatedTax
      );
      
      position.unrealizedPnL = unrealizedPnL;
      position.marketValue = marketValue;
    } else {
      position.unrealizedPnL = 0;
      position.marketValue = 0;
    }
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
    return ProfitLossUtil.calculateProfitLossPercentage(pnl, investment);
  }

  /**
   * 計算已實現績效百分比
   */
  static calculateRealizedPerformancePercentage(
    realizedPnL: number,
    totalSoldCost: number
  ): number {
    return ProfitLossUtil.calculateProfitLossPercentage(realizedPnL, totalSoldCost);
  }

  /**
   * 取得損益顏色
   */
  static getPnLColor(amount: number): string {
    return TradingCostUtil.getPnLColor(amount);
  }
}