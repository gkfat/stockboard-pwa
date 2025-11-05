<template>
  <v-chip
    :color="getPnLColor(stock.change)"
    :size="size"
    :variant="variant"
  >
    <v-icon
      v-if="stock.change !== 0"
      start
      size="small"
      :icon="getChangeIcon(stock.change)"
    />
    {{ formatChange(stock.change) }}
    ({{ formatPercentage(stock.changePercent) }})
  </v-chip>
</template>
<script lang="ts" setup>
import { StockInfo } from '@/types/stock';
import FormatUtil from '@/utils/formatUtil';
import TradingCostUtil from '@/utils/tradingCostUtil';
import type { VChip } from 'vuetify/components';

const stock = defineModel<StockInfo>('stock', {required: true});
const size = defineModel<string|number>('size', {default: 'small'});
const variant = defineModel<VChip['$props']['variant']>('variant');

const { formatChange, formatPercentage } = FormatUtil;

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = (val: number) => {
  return TradingCostUtil.getPnLColor(val).replace('text-', '');
};

const getChangeIcon = (change: number): string => {
  if (change > 0) return 'mdi-triangle';
  if (change < 0) return 'mdi-triangle-down';
  return '';
};
</script>