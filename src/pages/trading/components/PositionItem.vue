<template>
  <v-card
    class="mb-3"
    style="cursor: pointer"
    @click="$emit('click', position)"
  >
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-2">
        <div>
          <h3>{{ position.stockName }}</h3>
          <span class="text-caption text-grey">{{ position.ticker }}</span>
        </div>
        <div class="text-right">
          <div class="text-body-1">
            持有: {{ position.holdingQuantity }} 股
          </div>
          <div class="text-caption text-grey">
            均價: {{ formatPrice(position.avgBuyPrice) }}
          </div>
          <div
            class="text-body-2"
            :class="getStockPriceColor(position.ticker)"
          >
            現價: {{ formatPrice(getCurrentPrice(position.ticker)) }}
          </div>
        </div>
      </div>

      <v-row>
        <v-col cols="3">
          <div class="text-caption text-grey">
            已實現損益
          </div>
          <div :class="getPnLColor(position.realizedPnL)">
            {{ formatCurrency(position.realizedPnL) }}
          </div>
          <div
            :class="getPnLColor(calculateRealizedPerformance(position))"
            class="text-caption"
          >
            {{ formatPercentage(calculateRealizedPerformance(position)) }}
          </div>
        </v-col>
        <v-col cols="3">
          <div class="text-caption text-grey">
            未實現損益
          </div>
          <div :class="getPnLColor(position.unrealizedPnL)">
            {{ formatCurrency(position.unrealizedPnL) }}
          </div>
          <div
            :class="getPnLColor(calculateUnrealizedPerformance(position))"
            class="text-caption"
          >
            {{ formatPercentage(calculateUnrealizedPerformance(position)) }}
          </div>
        </v-col>
        <v-col cols="3">
          <div class="text-caption text-grey">
            總損益
          </div>
          <div :class="getPnLColor(position.realizedPnL + position.unrealizedPnL)">
            {{ formatCurrency(position.realizedPnL + position.unrealizedPnL) }}
          </div>
          <div
            :class="getPnLColor(calculateTotalPerformance(position))"
            class="text-caption"
          >
            {{ formatPercentage(calculateTotalPerformance(position)) }}
          </div>
        </v-col>
        <v-col cols="3">
          <div class="text-caption text-grey">
            市值
          </div>
          <div class="text-body-2">
            {{ formatCurrency(position.marketValue) }}
          </div>
          <div class="text-caption text-grey">
            {{ position.holdingQuantity }} 股
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useStockStore } from '@/composables/useStockStore';
import type { StockPosition } from '@/types/trading';
import { FormatUtil } from '@/utils/formatUtil';
import { PnLUtil } from '@/utils/pnlUtil';

// Emits
defineEmits<{
  click: [position: StockPosition];
}>();

const position = defineModel<StockPosition>({required: true});

// Composables
const { getStockData } = useStockStore();

// 使用統一的格式化工具
const { formatPrice, formatCurrency, formatPercentage } = FormatUtil;

// 取得股票目前價格
const getCurrentPrice = (ticker: string): number => {
  const stockData = getStockData(ticker);
  return stockData?.price || 0;
};

// 取得股票價格顏色
const getStockPriceColor = (ticker: string): string => {
  const stockData = getStockData(ticker);
  if (!stockData) return 'text-grey';
  
  if (stockData.change > 0) return 'text-error'; // 漲紅
  if (stockData.change < 0) return 'text-success'; // 跌綠
  return 'text-grey';
};

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = PnLUtil.getPnLColor;

// 計算已實現績效百分比 - 使用 PnLUtil
const calculateRealizedPerformance = (position: StockPosition): number => {
  return PnLUtil.calculateRealizedPerformancePercentage(
    position.realizedPnL, 
    position.totalSoldCost
  );
};

// 計算未實現績效百分比 - 使用 PnLUtil
const calculateUnrealizedPerformance = (position: StockPosition): number => {
  const currentPrice = getCurrentPrice(position.ticker);
  return PnLUtil.calculateUnrealizedPerformancePercentage(
    currentPrice,
    position.holdingQuantity,
    position.avgBuyPrice
  );
};

// 計算總績效百分比 - 使用 PnLUtil
const calculateTotalPerformance = (position: StockPosition): number => {
  const totalPnL = position.realizedPnL + position.unrealizedPnL;
  return PnLUtil.calculatePerformancePercentage(totalPnL, position.totalBuyAmount);
};
</script>