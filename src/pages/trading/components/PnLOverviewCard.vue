<template>
  <v-card
    class="mb-4"
    color="surface-variant"
  >
    <v-card-title>總損益統計</v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          cols="6"
          md="2"
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

const totalPnL = defineModel<TotalPnL>('totalPnL', { required: true });
const positions = defineModel<StockPosition[]>('positions', { required: true });

// 使用統一的格式化工具
const { formatCurrency, formatPercentage } = FormatUtil;

// 取得損益顏色
const getPnLColor = (amount: number): string => {
  if (amount > 0) return 'text-error'; // 獲利紅色
  if (amount < 0) return 'text-success'; // 虧損綠色
  return 'text-grey';
};

// 計算總績效百分比
const calculateTotalPerformance = (): number => {
  if (totalPnL.value.totalInvestment === 0) return 0;
  
  // 總績效 % = 總損益 / 總投資成本 * 100
  return (totalPnL.value.totalPnL / totalPnL.value.totalInvestment) * 100;
};

// 計算總已實現績效百分比
const calculateTotalRealizedPerformance = (): number => {
  // 計算所有已賣出金額總和
  const totalSellAmount = positions.value.reduce((sum, position) => sum + position.totalSellAmount, 0);
  if (totalSellAmount === 0) return 0;
  
  // 總已實現績效 % = 總已實現損益 / 總賣出金額 * 100
  return (totalPnL.value.totalRealizedPnL / totalSellAmount) * 100;
};

// 計算總未實現績效百分比
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
  
  // 總未實現績效 % = (總現值 - 總成本) / 總成本 * 100
  return ((totalCurrentValue - totalCostOfHoldings) / totalCostOfHoldings) * 100;
};
</script>