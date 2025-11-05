<template>
  <v-card
    class="mb-2"
    hover
    @click="emit('click')"
  >
    <v-card-text class="py-2">
      <v-row
        class="align-center"
        no-gutters
      >
        <!-- 股票名稱與代號 -->
        <v-col
          cols="5"
          class="d-flex align-center"
        >
          <div>
            <div class="text-subtitle-1 font-weight-medium text-truncate">
              {{ stock.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ stock.code }}
            </div>
          </div>
        </v-col>

        <!-- 股價與漲跌 -->
        <v-col
          cols="5"
          class="d-flex align-center"
        >
          <template v-if="isLoading">
            <div class="d-flex align-center w-100">
              <v-skeleton-loader
                type="text"
                class="me-2 w-100"
              />
            </div>
          </template>
          <template v-else>
            <v-row class="flex-column ma-0">
              <!-- 股價 -->
              <v-col
                class="text-subtitle-1 font-weight-bold text-right pa-0"
                :class="getPnLColorClass(stock.change)"
              >
                {{ formatPrice(stock.currentPrice) }}
              </v-col>
              
              <!-- 漲跌資訊 -->
              <v-col class="d-flex justify-end pa-0 ga-3">
                <p
                  class="text-caption font-weight-medium"
                  :class="getPnLColorClass(stock.change)"
                >
                  {{ formatPrice(stock.change) }}
                </p>
                <p
                  class="text-caption font-weight-medium"
                  :class="getPnLColorClass(stock.changePercent)"
                >
                  {{ formatPercent(stock.changePercent) }}
                </p>
              </v-col>
            </v-row>
          </template>
        </v-col>

        <!-- 移除按鈕 -->
        <v-col
          cols="1"
          class="ml-auto d-flex align-center justify-end"
        >
          <v-btn
            icon="mdi-minus-circle"
            variant="text"
            color="error"
            size="large"
            @click.stop="emit('remove')"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { StockInfo } from '@/types/stock';
import { FormatUtil } from '@/utils/formatUtil';
import { TradingCostUtil } from '@/utils/tradingCostUtil';

// Emits
const emit = defineEmits<{
  click: [],
  remove: []
}>();

// 取得損益顏色類別 - 文字用
const getPnLColorClass = (val: number) => {
  return TradingCostUtil.getPnLColor(val);
};

const stock = defineModel<StockInfo>({required: true});

// 計算屬性
const isLoading = computed(() => {
  return stock.value.updatedAt === '載入中...';
});

// 格式化函數
const { formatPrice, formatPercentage } = FormatUtil;

const formatPercent = (percent: number): string => {
  return formatPercentage(percent);
};
</script>

<style scoped>
</style>