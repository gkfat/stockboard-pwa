<template>
  <v-card
    class="stock-card bg-secondary"
    hover
    @click="$emit('click')"
  >
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <div class="text-h6">
          {{ stock.name }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ stock.code }}
        </div>
      </div>
      
      <v-btn
        icon
        variant="text"
        color="error"
        size="small"
        @click.stop="$emit('remove')"
      >
        <v-icon
          icon="mdi-minus-circle"
          size="x-large"
        />
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- 股價資訊 -->
      <div class="d-flex justify-space-between align-center mb-2">
        <div class="text-h5 font-weight-bold">
          <template v-if="isLoading">
            <v-skeleton-loader
              type="text"
              width="80px"
            />
          </template>
          <template v-else>
            {{ formatPrice(stock.price) }}
          </template>
        </div>
        
        <v-chip
          v-if="!isLoading"
          :color="getPnLColor(stock.change)"
          variant="elevated"
        >
          <v-icon
            start
            size="small"
          >
            {{ changeIcon }}
          </v-icon>
          {{ formatChange(stock.change) }}
          ({{ formatPercent(stock.changePercent) }})
        </v-chip>
        <v-skeleton-loader
          v-else
          type="chip"
          width="100px"
        />
      </div>

      <!-- 成交量 -->
      <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
        <span>成交量</span>
        <span v-if="!isLoading">{{ formatVolume(stock.volume) }}</span>
        <v-skeleton-loader
          v-else
          type="text"
          width="60px"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StockInfo } from '@/types/stock';
import { FormatUtil } from '@/utils/formatUtil';
import { PnLUtil } from '@/utils/pnlUtil';

// Emits
defineEmits<{
  click: []
  remove: []
}>();

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = (val: number) => {
  const res = PnLUtil.getPnLColor(val);

  return res.replace('text-', '');
};

const stock = defineModel<StockInfo>({required: true});

// 計算屬性
const isLoading = computed(() => {
  return stock.value.updatedAt === '載入中...';
});

const changeIcon = computed(() => {
  if (stock.value.change > 0) return 'mdi-trending-up';
  if (stock.value.change < 0) return 'mdi-trending-down';
  return 'mdi-trending-neutral';
});

// 格式化函數
const { formatPrice, formatChange, formatPercentage, formatLargeNumber } = FormatUtil;

const formatPercent = (percent: number): string => {
  return formatPercentage(percent);
};

const formatVolume = (volume: number): string => {
  return formatLargeNumber(volume);
};
</script>

<style scoped>
.stock-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.stock-card:hover {
  transform: translateY(-2px);
}
</style>