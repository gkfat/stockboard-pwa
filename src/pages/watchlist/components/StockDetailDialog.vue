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
        <v-row class="mb-3">
          <v-col cols="6">
            <v-card variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ formatPrice(stock.currentPrice) }}
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
                <PnLChip
                  :stock="stock"
                  :size="'large'"
                />
                <div class="text-body-2 text-medium-emphasis mt-1">
                  漲跌幅
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 圖表 Tabs + Chart 區塊 -->
        <v-card
          variant="outlined"
          class="mt-2"
        >
          <!-- Tab 選單 -->
          <v-tabs
            v-model="chartType"
            bg-color="surface"
            grow
          >
            <v-tab value="price">
              <v-icon start>
                mdi-chart-line
              </v-icon>
              價格走勢
            </v-tab>
            <v-tab value="volume">
              <v-icon start>
                mdi-chart-bar
              </v-icon>
              成交量
            </v-tab>
          </v-tabs>

          <v-divider />

          <!-- Tab 對應視圖 -->
          <v-tabs-window v-model="chartType">
            <!-- 價格走勢 -->
            <v-tabs-window-item value="price">
              <v-card-text
                class="chart-container"
                min-height="400"
              >
                <template v-if="loading">
                  <div class="text-center pa-8">
                    <v-progress-circular indeterminate />
                    <div class="mt-2">
                      載入圖表資料中...
                    </div>
                  </div>
                </template>

                <template v-else-if="!hasChartData">
                  <div class="text-center pa-8">
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
                </template>

                <canvas
                  v-else
                  ref="priceChartCanvas"
                  class="chart-canvas"
                />
              </v-card-text>
            </v-tabs-window-item>

            <!-- 成交量變化 -->
            <v-tabs-window-item value="volume">
              <v-card-text
                class="chart-container"
                min-height="400"
              >
                <!-- 內容完全共用，只依圖表類型 render -->
                <template v-if="loading">
                  <div class="text-center pa-8">
                    <v-progress-circular indeterminate />
                    <div class="mt-2">
                      載入圖表資料中...
                    </div>
                  </div>
                </template>

                <template v-else-if="!hasChartData">
                  <div class="text-center pa-8">
                    <v-icon
                      size="64"
                      color="grey-lighten-1"
                    >
                      mdi-chart-bar
                    </v-icon>
                    <div class="text-h6 mt-4">
                      暫無圖表資料
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      開市時間會自動記錄成交量變化
                    </div>
                  </div>
                </template>

                <canvas
                  v-else
                  ref="volumeChartCanvas"
                  class="chart-canvas"
                />
              </v-card-text>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>

        <!-- 下方圖表說明 -->
        <v-alert
          type="info"
          variant="tonal"
          class="mt-4"
        >
          圖表顯示當日 09:00-13:30 的{{ chartType === 'price' ? '價格走勢' : '成交量變化' }}，
          數據每 {{ INTERVAL_SECONDS / 1000 }} 秒更新一次（僅在開市時間）。
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { StockInfo } from '@/types/stock';
import { useStockPriceHistory } from '@/composables/useStockPriceHistory';
import { useStockStore } from '@/composables/useStockStore';
import { INTERVAL_SECONDS } from '@/constants';
import { Chart } from 'chart.js';
import { setupChart } from '@/utils/setupChart';
import PnLChip from './PnLChip.vue';
import FormatUtil from '@/utils/formatUtil';

setupChart();

const showDialog = defineModel<boolean>('showStockDetailDialog');
const stock = defineModel<StockInfo | null>('stock', {default: null});

// Store
const { loadPriceHistory, getStockTrend } = useStockPriceHistory();
const { getStockData } = useStockStore();
const { formatPrice } = FormatUtil;

// 響應式狀態
const priceChartCanvas = ref<HTMLCanvasElement>();
const volumeChartCanvas = ref<HTMLCanvasElement>();
const chartInstance = ref<Chart | null>(null);
const chartType = ref<'price' | 'volume'>('price');
const loading = ref(false);
const isCreatingChart = ref(false);

const chartData = computed(() => {
  const _stock = stock.value;
  if (!_stock) return null;
  
  const stockData = getStockData(_stock.code);
  if (!stockData) return null;
  
  return getStockTrend(_stock.code, stockData);
});

const hasChartData = computed(() => {
  return chartData.value?.hasHistory ?? false;
});

// 方法
const closeDialog = () => {
  showDialog.value = false;
  destroyChart();
};

const destroyChart = () => {
  if (chartInstance.value) {
    try {
      chartInstance.value.destroy();
      console.log('[StockDetailDialog] 圖表已銷毀');
    } catch (error) {
      console.warn('[StockDetailDialog] 銷毀圖表時出現警告:', error);
    } finally {
      chartInstance.value = null;
    }
  }
};

const createChart = async () => {
  // 防止重複創建
  if (isCreatingChart.value) return;
  
  // 驗證必要資料
  if (!chartData.value?.history || !Array.isArray(chartData.value.history) || chartData.value.history.length === 0) {
    console.warn('[StockDetailDialog] 無有效圖表資料');
    return;
  }

  isCreatingChart.value = true;
  
  try {
    await nextTick();
    
    // 先銷毀舊圖表
    destroyChart();
    
    // 根據圖表類型選擇正確的 canvas
    const canvas = chartType.value === 'price' ? priceChartCanvas.value : volumeChartCanvas.value;
    if (!canvas) {
      console.warn('[StockDetailDialog] Canvas 元素未找到');
      return;
    }

    // 清理 canvas 上的所有 Chart.js 相關屬性
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      console.warn('[StockDetailDialog] 發現現有圖表，強制銷毀');
      existingChart.destroy();
    }

    // 重置 canvas 尺寸強制清理
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[StockDetailDialog] 無法取得 Canvas 2D Context');
      return;
    }

    // 清空 canvas 內容
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        data: history.map(item => item.volume || 0),
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
    
    console.log('[StockDetailDialog] 圖表創建成功', chartType.value);
    
  } catch (error) {
    console.error('[StockDetailDialog] 創建圖表失敗:', error);
  } finally {
    isCreatingChart.value = false;
  }
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


// 監聽器
watch(showDialog, (newValue) => {
  if (newValue && stock.value) {
    loadChartData();
  } else {
    // 對話框關閉時重置圖表類型
    chartType.value = 'price';
  }
});

watch(chartType, async () => {
  if (hasChartData.value && !isCreatingChart.value) {
    // 立即銷毀當前圖表
    destroyChart();
    
    // 等待 DOM 更新和圖表完全銷毀
    await nextTick();
    setTimeout(() => {
      createChart();
    }, 100); // 增加延遲確保圖表完全清理
  }
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