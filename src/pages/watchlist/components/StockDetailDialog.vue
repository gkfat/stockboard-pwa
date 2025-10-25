<template>
  <v-dialog
    v-model="showDialog"
    max-width="800px"
    scrollable
  >
    <v-card v-if="stock">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <div class="text-h5">
            {{ stock.name }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ stock.code }}
          </div>
        </div>
        
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <!-- 股價資訊摘要 -->
        <v-row class="mb-4">
          <v-col cols="6">
            <v-card variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ formatPrice(stock.price) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  當前股價
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card variant="tonal">
              <v-card-text class="text-center">
                <v-chip
                  :color="getPnLColor(stock.change)"
                  variant="text"
                >
                  <v-icon
                    start
                    size="small"
                  >
                    {{ getChangeIcon(stock.change) }}
                  </v-icon>
                  {{ formatChange(stock.change) }}
                  ({{ formatPercent(stock.changePercent) }})
                </v-chip>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  漲跌幅
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 圖表切換按鈕 -->
        <v-btn-toggle
          v-model="chartType"
          mandatory
          variant="outlined"
          class="mb-4"
        >
          <v-btn value="price">
            <v-icon start>
              mdi-chart-line
            </v-icon>
            價格走勢
          </v-btn>
          <v-btn value="volume">
            <v-icon start>
              mdi-chart-bar
            </v-icon>
            成交量
          </v-btn>
        </v-btn-toggle>

        <!-- 圖表容器 -->
        <v-card
          variant="outlined"
          class="chart-container"
          min-height="400"
        >
          <v-card-text>
            <div
              v-if="loading"
              class="text-center pa-8"
            >
              <v-progress-circular indeterminate />
              <div class="mt-2">
                載入圖表資料中...
              </div>
            </div>
            
            <div
              v-else-if="!hasChartData"
              class="text-center pa-8"
            >
              <v-icon
                size="64"
                color="grey-lighten-1"
              >
                mdi-chart-line-variant
              </v-icon>
              <div class="text-h6 mt-4">
                暫無圖表資料
              </div>
              <div class="text-body-2 text-medium-emphasis">
                開市時間會自動記錄價格走勢
              </div>
            </div>
            
            <canvas
              v-else
              ref="chartCanvas"
              class="chart-canvas"
            />
          </v-card-text>
        </v-card>

        <!-- 圖表說明 -->
        <v-alert
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <template #title />
          圖表顯示當日 09:00-13:30 的{{ chartType === 'price' ? '價格走勢' : '成交量變化' }}，
          數據每10秒更新一次（僅在開市時間）。
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import type { StockInfo } from '@/types/stock';
import {
  Chart,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useStockPrice } from '@/composables/useStockPrice';
import { useStock } from '@/composables/useStock';
import { FormatUtil } from '@/utils/formatUtil';
import { TradingCostUtil } from '@/utils/tradingCostUtil';

const showDialog = defineModel<boolean>('showStockDetailDialog');
const stock = defineModel<StockInfo | null>('stock', {default: null});

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = TradingCostUtil.getPnLColor;

// 註冊 Chart.js 組件
Chart.register(
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// Store
const {loadPriceHistory, getStockTrend} = useStockPrice();
const {getStockData} = useStock();

// 響應式狀態
const chartCanvas = ref<HTMLCanvasElement>();
const chartInstance = ref<Chart | null>(null);
const chartType = ref<'price' | 'volume'>('price');
const loading = ref(false);

const chartData = computed(() => {
  const _stock = stock.value;
  if (!_stock) return null;
  
  const stockData = getStockData(_stock.code);
  if (!stockData) return null;
  
  return getStockTrend(_stock.code, stockData);
});

const hasChartData = computed(() => {
  return chartData.value?.hasHistory || false;
});

// 方法
const closeDialog = () => {
  showDialog.value = false;
  destroyChart();
};

const destroyChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
};

const createChart = async () => {
  if (!chartCanvas.value || !chartData.value?.history) return;

  await nextTick();
  destroyChart();

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  const history = chartData.value.history;
  const labels = history.map(item => item.time);
  
  const datasets = chartType.value === 'price' 
    ? [{
      label: '股價',
      data: history.map(item => item.price),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.1
    }]
    : [{
      label: '成交量',
      data: history.map(item => item.volume),
      backgroundColor: '#1976d2',
      borderColor: '#1976d2',
      borderWidth: 1
    }];

  chartInstance.value = new Chart(ctx, {
    type: chartType.value === 'price' ? 'line' : 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: '時間'
          }
        },
        y: {
          title: {
            display: true,
            text: chartType.value === 'price' ? '股價 (NT$)' : '成交量'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `${stock.value?.name} (${stock.value?.code}) - ${
            chartType.value === 'price' ? '價格走勢' : '成交量'
          }`
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
};

// 載入圖表資料
const loadChartData = async () => {
  if (!stock.value) return;

  loading.value = true;
  try {
    await loadPriceHistory(stock.value.code);
    await createChart();
  } catch (error) {
    console.error('載入圖表資料失敗:', error);
  } finally {
    loading.value = false;
  }
};

// 使用統一的格式化工具
const { formatPrice, formatChange } = FormatUtil;

// 百分比格式化（保持原有命名）
const formatPercent = (percent: number): string => {
  return FormatUtil.formatPercentage(percent);
};

const getChangeIcon = (change: number): string => {
  if (change > 0) return 'mdi-trending-up';
  if (change < 0) return 'mdi-trending-down';
  return 'mdi-trending-neutral';
};

// 監聽器
watch(showDialog, (newValue) => {
  if (newValue && stock.value) {
    loadChartData();
  }
});

watch(chartType, () => {
  if (hasChartData.value) {
    createChart();
  }
});

// 清理
onUnmounted(() => {
  destroyChart();
});
</script>

<style scoped>
.chart-container {
  position: relative;
}

.chart-canvas {
  max-height: 400px;
}
</style>