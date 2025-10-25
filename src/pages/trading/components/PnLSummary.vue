<template>
  <v-card
    rounded="0"
    elevation="0"
    color="surface-variant"
  >
    <v-card-text>
      <v-row>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            已實現損益
          </div>
          <div
            class="text-h6"
            :class="getPnLColor(totalPnL.totalRealizedPnL)"
          >
            {{ formatCurrency(totalPnL.totalRealizedPnL) }}
          </div>
          <div
            class="text-caption"
            :class="getPnLColor(calculateTotalRealizedPerformance())"
          >
            {{ formatPercentage(calculateTotalRealizedPerformance()) }}
          </div>
        </v-col>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            未實現損益
          </div>
          <div
            class="text-h6"
            :class="getPnLColor(totalPnL.totalUnrealizedPnL)"
          >
            {{ formatCurrency(totalPnL.totalUnrealizedPnL) }}
          </div>
          <div
            class="text-caption"
            :class="getPnLColor(calculateTotalUnrealizedPerformance())"
          >
            {{ formatPercentage(calculateTotalUnrealizedPerformance()) }}
          </div>
        </v-col>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            總損益
          </div>
          <div
            class="text-h6"
            :class="getPnLColor(totalPnL.totalPnL)"
          >
            {{ formatCurrency(totalPnL.totalPnL) }}
          </div>
          <div
            class="text-caption"
            :class="getPnLColor(calculateTotalPerformance())"
          >
            {{ formatPercentage(calculateTotalPerformance()) }}
          </div>
        </v-col>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            總市值
          </div>
          <div class="text-h6">
            {{ formatCurrency(totalPnL.currentMarketValue) }}
          </div>
          <div class="text-caption text-grey">
            目前持倉
          </div>
        </v-col>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            總投資金額
          </div>
          <div class="text-h6">
            {{ formatCurrency(totalPnL.totalInvestment) }}
          </div>
          <div class="text-caption text-grey">
            累計投入
          </div>
        </v-col>
        <v-col
          cols="6"
          md="2"
          class="pa-1"
        >
          <div class="text-caption text-grey">
            費用總計
          </div>
          <div class="text-h6">
            {{ formatCurrency(totalPnL.totalFees + totalPnL.totalTax) }}
          </div>
          <div class="text-caption text-grey">
            手續費+稅
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { StockPosition, TotalPnL } from '@/types/trading';
import { FormatUtil } from '@/utils/formatUtil';
import { PortfolioService } from '@/services/portfolioService';

const totalPnL = defineModel<TotalPnL>('totalPnL', { required: true });
const positions = defineModel<StockPosition[]>('positions', { required: true });

// 使用統一的格式化工具
const { formatCurrency, formatPercentage } = FormatUtil;

// 取得損益顏色 - 使用 PortfolioService
const getPnLColor = PortfolioService.getPnLColor;

// 計算總績效百分比 - 使用 PortfolioService
const calculateTotalPerformance = (): number => {
  return PortfolioService.calculatePerformancePercentage(
    totalPnL.value.totalPnL,
    totalPnL.value.totalInvestment
  );
};

// 計算總已實現績效百分比 - 使用 PortfolioService
const calculateTotalRealizedPerformance = (): number => {
  const totalSoldCost = positions.value.reduce((sum, position) => sum + position.totalSoldCost, 0);
  return PortfolioService.calculateRealizedPerformancePercentage(
    totalPnL.value.totalRealizedPnL,
    totalSoldCost
  );
};

// 計算總未實現績效百分比 - 使用 PortfolioService
const calculateTotalUnrealizedPerformance = (): number => {
  let totalCostOfHoldings = 0;
  let totalCurrentValue = 0;
  
  positions.value.forEach(position => {
    if (position.holdingQuantity > 0) {
      totalCostOfHoldings += position.avgBuyPrice * position.holdingQuantity;
      totalCurrentValue += position.marketValue;
    }
  });
  
  if (totalCostOfHoldings === 0) return 0;
  const unrealizedPnL = totalCurrentValue - totalCostOfHoldings;
  return PortfolioService.calculatePerformancePercentage(unrealizedPnL, totalCostOfHoldings);
};
</script>