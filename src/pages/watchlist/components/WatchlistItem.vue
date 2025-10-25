<template>
  <v-card
    class="mb-2"
    hover
    @click="$emit('click')"
  >
    <v-card-text class="py-2">
      <v-row
        class="align-center"
        no-gutters
      >
        <!-- 名稱/代號 -->
        <v-col
          cols="12"
          sm="3"
          :class="['d-flex', xs ? 'align-center ga-3' : 'flex-column']"
        >
          <span class="text-subtitle-1 font-weight-medium">
            {{ stock.name }}
          </span>
          <span class="text-caption text-medium-emphasis">
            {{ stock.code }}
          </span>
        </v-col>

        <!-- 股價 -->
        <v-col
          cols="4"
          sm="2"
          :class="xs ? 'text-left' : 'text-right'"
        >
          <template v-if="isLoading">
            <v-skeleton-loader
              type="text"
              width="50"
            />
          </template>
          <template v-else>
            <span :class="['text-h6 font-weight-bold', getPnLColorClass(stock.change)]">
              {{ formatPrice(stock.price) }}
            </span>
          </template>
        </v-col>

        <!-- 漲跌 -->
        <v-col
          cols="3"
          sm="2"
          class="text-center"
        >
          <template v-if="isLoading">
            <v-skeleton-loader
              type="chip"
              width="60"
            />
          </template>
          <template v-else>
            <div :class="['d-flex align-center font-weight-bold justify-center', getPnLColorClass(stock.change)]">
              <v-icon
                size="small"
                class="me-1"
              >
                {{ changeIcon }}
              </v-icon>
              {{ formatChange(stock.change) }}
            </div>
            <div
              class="text-caption"
              :class="getPnLColorClass(stock.changePercent)"
            >
              {{ formatPercent(stock.changePercent) }}
            </div>
          </template>
        </v-col>

        <!-- 成交量 -->
        <v-col
          cols="3"
          sm="3"
          class="text-center"
        >
          <template v-if="isLoading">
            <v-skeleton-loader
              type="text"
              width="50"
            />
          </template>
          <template v-else>
            <div class="text-caption text-medium-emphasis">
              成交量
            </div>
            <div class="text-body-2">
              {{ formatVolume(stock.volume) }}
            </div>
          </template>
        </v-col>

        <!-- 刪除 -->
        <v-col
          cols="2"
          sm="2"
          class="d-flex justify-end"
        >
          <v-btn
            icon
            variant="text"
            color="error"
            size="small"
            @click.stop="$emit('remove')"
          >
            <v-icon size="large">
              mdi-minus-circle
            </v-icon>
          </v-btn>
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
import { useDisplay } from 'vuetify';

// Emits
defineEmits<{
  click: []
  remove: []
}>();

const { xs } = useDisplay();

// 取得損益顏色類別 - 文字用
const getPnLColorClass = (val: number) => {
  return TradingCostUtil.getPnLColor(val);
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
</style>