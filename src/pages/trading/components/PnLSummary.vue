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
import { PnLUtil } from '@/utils/pnlUtil';

const totalPnL = defineModel<TotalPnL>('totalPnL', { required: true });
const positions = defineModel<StockPosition[]>('positions', { required: true });

// 使用統一的格式化工具
const { formatCurrency, formatPercentage } = FormatUtil;

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = PnLUtil.getPnLColor;

// 計算總績效百分比 - 使用 PnLUtil
const calculateTotalPerformance = (): number => {
  return PnLUtil.calculateTotalPerformancePercentage(
    totalPnL.value.totalPnL,
    totalPnL.value.totalInvestment
  );
};

// 計算總已實現績效百分比 - 使用 PnLUtil
const calculateTotalRealizedPerformance = (): number => {
  return PnLUtil.calculateTotalRealizedPerformancePercentage(
    totalPnL.value.totalRealizedPnL,
    positions.value
  );
};

// 計算總未實現績效百分比 - 使用 PnLUtil
const calculateTotalUnrealizedPerformance = (): number => {
  return PnLUtil.calculateTotalUnrealizedPerformancePercentage(positions.value);
};
</script>