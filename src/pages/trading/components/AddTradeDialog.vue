<template>
  <v-dialog
    v-model="isShowDialog"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>新增交易紀錄</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto">
        <v-form
          ref="formRef"
          v-model="formValid"
        >
          <v-row>
            <!-- 交易日期 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.traded_at"
                label="交易日期"
                type="date"
                :rules="dateRules"
                hide-details
              />
            </v-col>
            
            <!-- 股票代號 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.ticker"
                label="股票代號"
                persistent-placeholder
                placeholder="例如: 2330, AAPL, 00878"
                :rules="tickerRules"
                hide-details="auto"
                required
                @keyup.enter="fetchStockInfo"
                @blur="fetchStockInfo"
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-magnify"
                    variant="text"
                    size="small"
                    :loading="loading"
                    @click="fetchStockInfo"
                  />
                </template>
              </v-text-field>

              <!-- 股票名稱顯示 -->
              <div
                v-if="stockInfo"
                class="mt-3"
              >
                <v-chip
                  color="info"
                  size="small"
                >
                  {{ stockInfo.name }} ({{ stockInfo.code }})
                  <span class="ml-3">
                    現價: {{ formatCurrencyWithDecimal(stockInfo.currentPrice, 2) }}
                  </span>
                </v-chip>
              </div>
            </v-col>

            <!-- 買賣方向 -->
            <v-col cols="12">
              <v-btn-toggle
                v-model="formData.direction"
                mandatory
                rounded="x-large"
                class="w-100 border border-opacity-25"
              >
                <v-btn
                  :value="TradeDirection.BUY"
                  color="success"
                  class="flex-grow-1"
                >
                  買進
                </v-btn>
                <v-btn
                  :value="TradeDirection.SELL"
                  color="error"
                  class="flex-grow-1"
                >
                  賣出
                </v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- 價格 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.price"
                label="成交價格"
                type="text"
                persistent-placeholder
                placeholder="請輸入成交價格"
                inputmode="decimal"
                hide-details="auto"
                suffix="元"
                :rules="priceRules"
                required
                @input="handlePriceInput"
              />
            </v-col>

            <!-- 數量 -->
            <v-col cols="12">
              <v-text-field
                v-model.number="formData.quantity"
                type="number"
                min="1"
                suffix="股"
                placeholder="請輸入成交數量"
                persistent-placeholder
                hide-details="auto"
                :rules="quantityRules"
                required
              >
                <template #label>
                  <p v-if="isBuy">
                    成交數量
                  </p>
                  <div v-else>
                    成交數量 (目前持有 {{ currentHoldings }})
                  </div>
                </template>
              </v-text-field>
            </v-col>

            <!-- 手續費 -->
            <v-col cols="12">
              <v-text-field
                v-model.number="formData.fee"
                type="number"
                suffix="元"
                :placeholder="`請輸入手續費(預估為 ${estimate?.fee ?? '0'} 元)`"
                persistent-placeholder
                hide-details="auto"
                required
              >
                <template #label>
                  手續費 <span class="me-3 text-error">*若要使用預設值請留空</span>
                </template>
              </v-text-field>
            </v-col>

            <!-- 交易稅 -->
            <v-col
              v-if="!isBuy"
              cols="12"
            >
              <v-text-field
                v-model="formData.tax"
                type="number"
                step="1"
                min="0"
                suffix="元"
                persistent-placeholder
                clearable
                :placeholder="`請輸入交易稅(預估為 ${estimate?.tax ?? '0'} 元)`"
              >
                <template #label>
                  交易稅 <span class="me-3 text-error">*若要使用預設值請留空</span>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="flex-wrap pa-0">
        <v-col
          cols="12"
          class="bg-secondary"
        >
          <v-row class="ma-0 justify-end align-center ga-2">
            <!-- 手續費 -->
            <v-col
              cols="auto"
              class="pa-0 font-weight-bold"
            >
              手續費
            </v-col>
            <v-col
              cols="auto"
              class="pa-0 font-weight-bold"
              :class="totalCostColor"
            >
              {{ summary.fee }}
            </v-col>
            
            <!-- 交易稅 -->
            <v-col
              v-if="!isBuy"
              cols="auto"
              class="pa-0 font-weight-bold"
            >
              交易稅
            </v-col>
            <v-col
              v-if="!isBuy"
              cols="auto"
              class="pa-0 font-weight-bold"
              :class="totalCostColor"
            >
              {{ summary.tax }}
            </v-col>

            <!-- 總金額 -->
            <v-col
              cols="auto"
              class="pa-0 font-weight-bold"
            >
              {{ isBuy ? '總成本' : '實收金額' }}
            </v-col>
            <v-col
              cols="auto"
              class="pa-0 font-weight-bold"
              :class="totalCostColor"
            >
              {{ summary.total }}
            </v-col>
          </v-row>
        </v-col>

        <v-col
          cols="12"
          class="text-right"
        >
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            :disabled="!formValid || !sellQuantityValid"
            @click="submitTrade"
          >
            新增交易
          </v-btn>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue';
import { useTradingData } from '@/composables/useTradingData';
import { useStockDetail } from '@/composables/useStockDetail';
import { useTradeRules } from '../composables/useTradeRules';
import { TradingService } from '@/services/tradingService';
import { DateUtils } from '@/utils/dateUtils';
import { FormatUtil } from '@/utils/formatUtil';
import { TradingFeeResult } from '@/types/trading';
import { TradeDirection } from '@/enums/trade-direction';

const emit = defineEmits<{
  'tradeAdded': [];
}>();

const isShowDialog = defineModel<boolean>({ required: true });

// 表單資料
const formData = ref({
  ticker: '',
  traded_at: DateUtils.getCurrentISOString().slice(0, 10), // date 格式 YYYY-MM-DD
  direction: TradeDirection.BUY,
  price: '',
  quantity: 1,
  fee: '',
  tax: ''
});

// Composables
const { addTrade, positions } = useTradingData();
const { stockInfo, loadStockDetail } = useStockDetail();
const { isBuy, tickerRules, dateRules, priceRules, quantityRules } = useTradeRules(formData);

// 使用統一的格式化工具
const { formatCurrencyWithDecimal, formatQuantity } = FormatUtil;

// Form 相關
const formRef = useTemplateRef('formRef');
const formValid = ref(false);
const loading = ref(false);

// 費用估算
const estimate = computed<TradingFeeResult | null>(() => {
  const price = parseFloat(formData.value.price);
  const quantity = formData.value.quantity;
  
  if (!price || !quantity || price <= 0 || quantity <= 0) {
    return null;
  }
  
  return TradingService.estimateFees(price, quantity, formData.value.direction);
});

const summary = computed(() => {
  const price = parseFloat(formData.value.price);
  const quantity = formData.value.quantity;
  
  return TradingService.calculateTradingSummary(
    price,
    quantity,
    formData.value.direction,
    formData.value.fee,
    formData.value.tax
  );
});

const currentHoldings = computed(() => {
  const ticker = formData.value.ticker.trim().toUpperCase();
  const findPosition = positions.value.find((v) => v.ticker === ticker);
  return formatQuantity(findPosition?.holdingQuantity ?? 0);
});

// 檢查賣出數量是否超過持倉
const sellQuantityValid = computed<boolean>(() => {
  if (isBuy.value) {
    return true;
  }
  
  const ticker = formData.value.ticker.trim().toUpperCase();
  const sellQuantity = formData.value.quantity;
  
  if (!ticker || !sellQuantity || sellQuantity <= 0) {
    return true;
  }
  
  // 找到對應股票的持倉
  const position = positions.value.find(p => p.ticker === ticker);
  const currentHolding = position?.holdingQuantity || 0;
  
  if (sellQuantity > currentHolding) {
    return false;
  }
  
  return true;
});


// 監聽買賣方向變化 (isBuy 已從 useTradeRules 提供)

watch(
  isBuy,
  (val) => {
    if (val) {
      formData.value.tax = ''; // 買入沒有交易稅
    }
  }
);

// 總成本顏色
const totalCostColor = computed(() => isBuy.value ? 'text-success' : 'text-error');

// 處理價格輸入（限制小數位數）
const handlePriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  
  // 移除非數字和小數點的字符
  value = value.replace(/[^0-9.]/g, '');
  
  // 確保只有一個小數點
  const parts = value.split('.');
  if (parts.length > 2) {
    value = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  
  // 限制小數點後最多兩位
  if (parts[1] && parts[1].length > 2) {
    value = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  
  formData.value.price = value;
};

// 取得股票資訊
const fetchStockInfo = async () => {
  if (formData.value.ticker && formData.value.ticker.trim().length > 0) {
    try {
      await loadStockDetail(formData.value.ticker.trim().toUpperCase());
    } catch (error) {
      console.warn('無法取得股票資訊:', error);
    }
  }
};

// 關閉對話框
const closeDialog = () => {
  resetForm();
  isShowDialog.value = false;
};

// 重置表單
const resetForm = () => {
  formData.value = {
    ticker: '',
    traded_at: DateUtils.getCurrentISOString().slice(0, 10), // date 格式
    direction: TradeDirection.BUY,
    price: '',
    quantity: 1,
    fee: '', // 重置為空字串
    tax: ''  // 重置為空字串
  };
  stockInfo.value = null;
  if (formRef.value) {
    formRef.value.reset();
  }
};

// 提交交易
const submitTrade = async () => {
  if (!formValid.value) return;

  loading.value = true;
  
  try {
    // 將日期轉換為 ISO string（設定為該日的中午 12:00）
    const tradeDate = new Date(`${formData.value.traded_at}T12:00:00`);
    
    // 決定最終使用的費用值
    const finalFee = (formData.value.fee !== '' && formData.value.fee !== null && formData.value.fee !== undefined)
      ? parseFloat(formData.value.fee.toString())
      : (estimate.value?.fee || 0);
    
    const finalTax = (formData.value.tax !== '' && formData.value.tax !== null && formData.value.tax !== undefined)
      ? parseFloat(formData.value.tax.toString())
      : (estimate.value?.tax || 0);
    
    const tradeData = {
      ticker: formData.value.ticker.trim().toUpperCase(),
      traded_at: tradeDate.toISOString(),
      direction: formData.value.direction,
      price: parseFloat(formData.value.price),
      quantity: formData.value.quantity,
      fee: finalFee,
      tax: finalTax
    };

    const success = await addTrade(tradeData);
    
    if (success) {
      emit('tradeAdded');
      closeDialog();
    }
  } catch (error) {
    console.error('新增交易失敗:', error);
  } finally {
    loading.value = false;
  }
};
</script>