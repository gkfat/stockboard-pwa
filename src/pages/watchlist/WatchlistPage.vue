<template>
  <v-container>
    <div
      v-if="!watchlist.length"
      class="empty-state"
    >
      <v-card
        class="text-center pa-8"
        variant="outlined"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-4"
        >
          mdi-star-plus-outline
        </v-icon>
        <h3 class="text-h6 mb-2">
          尚未新增任何自選股
        </h3>
        <p class="text-body-2 text-grey mb-4">
          點擊下方按鈕開始新增您關注的股票
        </p>
        <v-btn
          color="primary"
          size="large"
          @click="showAddDialog = true"
        >
          <v-icon start>
            mdi-plus
          </v-icon>
          新增自選股
        </v-btn>
      </v-card>
    </div>
  
    <!-- 股票清單 -->
    <div v-else>
      <!-- 最後更新時間顯示 -->
      <v-card
        variant="outlined"
        class="mb-4 pa-3"
      >
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon
              class="me-2"
              size="small"
              color="primary"
            >
              mdi-clock-outline
            </v-icon>
            <span class="text-body-2">
              {{ DateUtils.formatLastUpdateTime(lastUpdateTime) }}
            </span>
          </div>
          <v-icon
            v-if="isUpdating"
            start
            size="small"
            color="warning"
            icon="mdi-loading"
            class="rotating-icon"
          />
          <v-icon
            v-else
            color="success"
            size="small"
            icon="mdi-check"
          />
        </div>
      </v-card>
  
      <v-row class="align-center justify-space-between">
        <v-col
          cols="auto"
          class="text-body-2 text-grey"
        >
          共 {{ stockList.length }} 檔股票
        </v-col>
        <v-col cols="auto">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddDialog = true"
          >
            新增
          </v-btn>
        </v-col>
      </v-row>

      <v-spacer class="mb-5" />
  
      <div class="stock-list">
        <WatchlistItem
          v-for="(stock, index) in stockList"
          :key="stock.code"
          v-model="stockList[index]"
          @click="handleStockClick(stock)"
          @remove="handleRemoveStock(stock)"
        />
      </div>
    </div>
  
    <!-- 新增股票對話框 -->
    <AddStockDialog
      v-model="showAddDialog"
      @stock-added="handleStockAdded"
    />
  
    <!-- 股票圖表對話框 -->
    <StockDetailDialog
      v-model:show-stock-detail-dialog="showStockDetailDialog"
      v-model:stock="selectedStock"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { StockInfo } from '@/types/stock';
import WatchlistItem from './components/WatchlistItem.vue';
import AddStockDialog from './components/AddStockDialog.vue';
import { useWatchlistState } from '@/composables/useWatchlistState';
import { useWatchlistActions } from '@/composables/useWatchlistActions';
import { useStockStore } from '@/composables/useStockStore';
import { useStockUpdater } from '@/composables/useStockUpdater';
import { DateUtils } from '@/utils/dateUtils';
import StockDetailDialog from './components/StockDetailDialog.vue';
import { useMarketTime } from '@/composables/useMarketTime';

const { updateAllStocks, startAutoUpdate } = useStockUpdater();
const { isMarketOpen } = useMarketTime();
const { watchlist } = useWatchlistState();
const { removeStock, initializeWatchlist } = useWatchlistActions();
const { getStockData, lastUpdateTime, isUpdating } = useStockStore();

// 響應式狀態
const showAddDialog = ref(false);
const showStockDetailDialog = ref(false);
const selectedStock = ref<StockInfo | null>(null);

// 計算屬性 - 組合自選股與股票資料
const stockList = computed(() => {
  return watchlist.value.map(item => {
    const stockInfo = getStockData(item.code);
      
    // 如果沒有股票資料，返回基本資訊以便顯示
    if (!stockInfo) {
      return {
        code: item.code,
        name: item.name,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        updatedAt: '載入中...',
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0
      };
    }
    return stockInfo;
  });
});

// 事件處理
const handleStockClick = (stock: StockInfo) => {
  selectedStock.value = stock;
  showStockDetailDialog.value = true;
};

const handleRemoveStock = async (stock: StockInfo) => {
  const success = await removeStock(stock.code);
  if (!success) {
    console.error('[WatchlistPage] 移除股票失敗:', stock.code);
  }
};

const handleStockAdded = () => {
  showAddDialog.value = false;
};

watch(
  () => watchlist.value.length,
  () => {
    updateAllStocks();
  },
  { immediate: true }
);

watch(
  isMarketOpen,
  (val) => {
    if (val) {
      startAutoUpdate();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await initializeWatchlist();
  await updateAllStocks();
});
</script>

<style scoped>
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating-icon {
  animation: rotate 1s linear infinite;
}
</style>