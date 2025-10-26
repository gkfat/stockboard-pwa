<template>
  <!-- 總損益統計 -->
  <PnLSummary
    v-model:positions="positions"
    v-model:total-pn-l="totalPnL"
  />

  <v-container>
    <v-row class="align-center justify-end">
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddDialog = true"
        >
          新增交易
        </v-btn>
      </v-col>
    </v-row>

    <v-spacer class="mb-5" />

    <!-- 股票持倉列表 -->
    <div v-if="positions.length > 0">
      <PositionItem
        v-for="(position, index) in positions"
        :key="position.ticker"
        v-model="positions[index]"
        @trade-deleted="handleTradeDeleted"
      />
    </div>

    <!-- 空狀態 -->
    <div
      v-else
      class="empty-state"
    >
      <v-icon
        size="64"
        color="grey"
      >
        mdi-chart-line
      </v-icon>
      <h2 class="text-h6 mt-4 text-grey">
        尚無交易紀錄
      </h2>
      <p class="text-body-2 text-grey mb-4">
        開始記錄您的第一筆交易
      </p>
      <v-btn
        color="primary"
        size="large"
        @click="showAddDialog = true"
      >
        新增交易紀錄
      </v-btn>
    </div>

    <!-- 新增交易對話框 -->
    <AddTradeDialog
      v-model="showAddDialog"
      @trade-added="handleTradeAdded"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AddTradeDialog from './components/AddTradeDialog.vue';
import PositionItem from './components/PositionItem.vue';
import { useTradingData } from '@/composables/useTradingData';
import PnLSummary from './components/PnLSummary.vue';

const { positions, totalPnL, loadTradingData } = useTradingData();

const showAddDialog = ref(false);

// 處理交易新增完成
const handleTradeAdded = async (): Promise<void> => {
  showAddDialog.value = false;
  await loadTradingData(); // 重新載入數據
};

// 處理交易刪除完成
const handleTradeDeleted = async (ticker: string): Promise<void> => {
  await loadTradingData(); // 重新載入數據
};

// 生命週期
onMounted(() => {
  loadTradingData();
});
</script>

<style scoped>
.trading-list-page {
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

@media (max-width: 600px) {
  .trading-list-page {
    padding: 8px;
  }
}
</style>