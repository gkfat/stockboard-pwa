<template>
  <div class="mb-5 position-relative">
    <!-- 展開/收合按鈕 -->
    <v-btn
      size="small"
      class="expand-button"
      icon
      elevation="0"
      :loading="loadingTrades"
      @click.stop="toggleExpanded"
    >
      <v-icon :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
    </v-btn>

    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between mb-2">
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
  
      <!-- 交易明細表格 -->
      <v-expand-transition>
        <div
          v-if="isExpanded"
          class="px-4 pb-4"
        >
          <v-divider class="mb-3" />
          <h4 class="mb-3">
            交易明細
          </h4>
          
          <v-data-table
            :headers="table.headers"
            :items="table.data"
            :loading="loadingTrades"
            :mobile="xs"
            density="compact"
            hide-default-footer
            class="trade-details-table"
          >
            <template #[`item.direction_display`]="{ item }">
              <span :class="item.direction_class">{{ item.direction_display }}</span>
            </template>
            
            <template #[`item.pnl_display`]="{ item }">
              <span :class="item.pnl_class">{{ item.pnl_display }}</span>
            </template>
            
            <template #[`item.performance_display`]="{ item }">
              <span :class="item.performance_class">{{ item.performance_display }}</span>
            </template>
            
            <template #[`item.actions`]="{ item }">
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="text"
                :loading="deletingTradeId === item.id"
                @click="confirmDeleteTrade(item)"
              />
            </template>
          </v-data-table>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStockStore } from '@/composables/useStockStore';
import { db } from '@/db/stockDB';
import { TradeDirection } from '@/enums/trade-direction';
import type { StockPosition, TradeRecord } from '@/types/trading';
import { FormatUtil } from '@/utils/formatUtil';
import { PortfolioService } from '@/services/portfolioService';
import { useDisplay } from 'vuetify';

// Emits
const emit = defineEmits<{
  click: [position: StockPosition];
  tradeDeleted: [ticker: string];
}>();

const position = defineModel<StockPosition>({required: true});

// Composables
const { getStockData } = useStockStore();

// 使用統一的格式化工具
const { formatPrice, formatCurrency, formatPercentage } = FormatUtil;
const {xs} = useDisplay();

// 交易明細狀態
const isExpanded = ref(false);
const loadingTrades = ref(false);
const tradeRecords = ref<TradeRecord[]>([]);
const deletingTradeId = ref<string | null>(null);

// 表格配置
const table = computed<{
  data: Array<TradeRecord & {
    traded_at_display: string;
    direction_display: string;
    price_display: string;
    fee_display: string;
    tax_display: string;
    pnl_display: string;
    performance_display: string;
    direction_class: string;
    pnl_class: string;
    performance_class: string;
  }>;
  headers: Array<{
    title: string;
    key: string;
    width?: string;
    sortable?: boolean;
    cellClass?: string;
  }>;
}>(() => {
  const processedData = tradeRecords.value.map(item => {
    const pnl = calculateTradePnL(item);
    const performance = calculateTradePerformance(item);
    
    return {
      ...item,
      // 格式化後的顯示值
      traded_at_display: formatDate(item.traded_at),
      direction_display: item.direction === TradeDirection.BUY ? '買進' : '賣出',
      price_display: formatPrice(item.price),
      fee_display: formatCurrency(item.fee),
      tax_display: formatCurrency(item.tax),
      pnl_display: formatCurrency(pnl),
      performance_display: formatPercentage(performance),
      
      // 樣式類別
      direction_class: item.direction === TradeDirection.BUY ? 'trade-direction-buy' : 'trade-direction-sell',
      pnl_class: getPnLColor(pnl),
      performance_class: getPnLColor(performance)
    };
  });

  return {
    data: processedData,
    headers: [
      {
        title: '交易日期',
        key: 'traded_at_display',
        width: '120px',
        sortable: false
      },
      {
        title: '交易方向',
        key: 'direction_display',
        width: '120px',
        sortable: false
      },
      {
        title: '數量(股)',
        key: 'quantity',
        width: '120px',
        sortable: false
      },
      {
        title: '價格',
        key: 'price_display',
        width: '100px',
        sortable: false
      },
      {
        title: '手續費',
        key: 'fee_display',
        width: '100px',
        sortable: false
      },
      {
        title: '交易稅',
        key: 'tax_display',
        width: '100px',
        sortable: false
      },
      {
        title: '損益',
        key: 'pnl_display',
        width: '100px',
        sortable: false
      },
      {
        title: '績效',
        key: 'performance_display',
        width: '100px',
        sortable: false
      },
      {
        title: '操作',
        key: 'actions',
        width: '80px',
        sortable: false
      }
    ]
  };
});

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

// 取得損益顏色 - 使用 PortfolioService
const getPnLColor = PortfolioService.getPnLColor;

// 計算已實現績效百分比 - 使用 PortfolioService
const calculateRealizedPerformance = (position: StockPosition): number => {
  return PortfolioService.calculateRealizedPerformancePercentage(
    position.realizedPnL, 
    position.totalSoldCost
  );
};

// 計算未實現績效百分比 - 使用 PortfolioService
const calculateUnrealizedPerformance = (position: StockPosition): number => {
  if (position.holdingQuantity <= 0 || position.avgBuyPrice <= 0) return 0;
  
  const currentPrice = getCurrentPrice(position.ticker);
  const costValue = position.avgBuyPrice * position.holdingQuantity;
  const marketValue = currentPrice * position.holdingQuantity;
  const unrealizedPnL = marketValue - costValue;
  
  return PortfolioService.calculatePerformancePercentage(unrealizedPnL, costValue);
};

// 計算總績效百分比 - 使用 PortfolioService
const calculateTotalPerformance = (position: StockPosition): number => {
  const totalPnL = position.realizedPnL + position.unrealizedPnL;
  return PortfolioService.calculatePerformancePercentage(totalPnL, position.totalBuyAmount);
};

// 展開/收合交易明細
const toggleExpanded = async () => {
  isExpanded.value = !isExpanded.value;
  
  if (isExpanded.value && tradeRecords.value.length === 0) {
    await loadTradeRecords();
  }
};

// 載入交易記錄
const loadTradeRecords = async () => {
  try {
    loadingTrades.value = true;
    tradeRecords.value = await db.getTradesByTicker(position.value.ticker);
  } catch (error) {
    console.error('載入交易記錄失敗:', error);
  } finally {
    loadingTrades.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 計算單筆交易損益
const calculateTradePnL = (trade: TradeRecord): number => {
  const amount = trade.price * trade.quantity;
  
  if (trade.direction === TradeDirection.BUY) {
    // 買進交易的損益計算基於目前價格
    const currentPrice = getCurrentPrice(trade.ticker);
    const currentValue = currentPrice * trade.quantity;
    return currentValue - amount - trade.fee;
  } else {
    // 賣出交易的實際收入
    return amount - trade.fee - trade.tax;
  }
};

// 計算單筆交易績效
const calculateTradePerformance = (trade: TradeRecord): number => {
  const amount = trade.price * trade.quantity;
  const pnl = calculateTradePnL(trade);
  
  if (trade.direction === TradeDirection.BUY) {
    const cost = amount + trade.fee;
    return cost > 0 ? (pnl / cost) * 100 : 0;
  } else {
    // 賣出交易的績效需要基於原始買入成本計算
    // 這裡簡化處理，基於賣出金額計算
    return amount > 0 ? (pnl / amount) * 100 : 0;
  }
};

// 確認刪除交易記錄
const confirmDeleteTrade = async (trade: TradeRecord) => {
  if (confirm(`確定要刪除此筆交易記錄嗎？\n\n${trade.direction === TradeDirection.BUY ? '買進' : '賣出'} ${trade.quantity} 股 @ ${formatPrice(trade.price)}\n交易日期: ${formatDate(trade.traded_at)}`)) {
    await deleteTrade(trade);
  }
};

// 刪除交易記錄
const deleteTrade = async (trade: TradeRecord) => {
  if (!trade.id) {
    console.error('無效的交易記錄 ID');
    return;
  }
  
  try {
    deletingTradeId.value = trade.id;
    await db.deleteTrade(trade.id);
    
    // 從本地清單中移除
    const index = tradeRecords.value.findIndex(t => t.id === trade.id);
    if (index > -1) {
      tradeRecords.value.splice(index, 1);
    }
    
    // 發出事件通知父組件重新載入交易資料
    emit('tradeDeleted', trade.ticker);
    
  } catch (error) {
    console.error('刪除交易記錄失敗:', error);
    alert('刪除失敗，請稍後再試');
  } finally {
    deletingTradeId.value = null;
  }
};
</script>

<style scoped>
.expand-button {
  position: absolute;
  bottom: -15px;
  right: 10px;
  background-color: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 99;
}

.expand-button:hover {
  background-color: #f5f5f5;
}

.trade-details-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.trade-direction-buy {
  color: #4caf50;
  font-weight: 500;
}

.trade-direction-sell {
  color: #f44336;
  font-weight: 500;
}
</style>