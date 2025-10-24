<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500px"
    persistent
    @update:model-value="updateModelValue"
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
          <!-- 股票代號 -->
          <v-text-field
            v-model="formData.ticker"
            label="股票代號"
            placeholder="例如: 2330, AAPL, 00878"
            :rules="tickerRules"
            required
            @blur="fetchStockInfo"
          />

          <!-- 股票名稱顯示 -->
          <div
            v-if="stockInfo"
            class="mb-4"
          >
            <v-chip
              color="primary"
              variant="outlined"
            >
              {{ stockInfo.name }} ({{ stockInfo.code }})
            </v-chip>
            <div class="text-caption text-grey mt-1">
              目前價格: {{ stockInfo.currentPrice.toFixed(2) }}
            </div>
          </div>

          <!-- 交易日期 -->
          <v-text-field
            v-model="formData.traded_at"
            label="交易日期"
            type="date"
            :rules="dateRules"
            required
          />

          <!-- 買賣方向 -->
          <div class="mb-4">
            <label class="text-body-2 mb-2 d-block">買賣方向 <span class="text-error">*</span></label>
            <v-btn-toggle
              v-model="formData.direction"
              mandatory
              variant="outlined"
              divided
              class="w-100"
            >
              <v-btn
                value="BUY"
                color="success"
                class="flex-grow-1"
              >
                買入
              </v-btn>
              <v-btn
                value="SELL"
                color="error"
                class="flex-grow-1"
              >
                賣出
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- 價格 -->
          <v-text-field
            v-model="formData.price"
            label="成交價格"
            type="text"
            inputmode="decimal"
            suffix="元"
            :rules="priceRules"
            required
            @input="handlePriceInput"
          />

          <!-- 數量 -->
          <v-text-field
            v-model.number="formData.quantity"
            label="成交數量"
            type="number"
            min="1"
            suffix="股"
            :rules="quantityRules"
            required
            @input="calculateFees"
          />

          <!-- 費用計算顯示 -->
          <v-card
            v-if="showFeeCalculation"
            variant="outlined"
            class="mb-4"
          >
            <v-card-subtitle>費用估算</v-card-subtitle>
            <v-card-text>
              <!-- 手續費 -->
              <v-text-field
                v-model="formData.fee"
                label="手續費"
                type="number"
                step="1"
                min="0"
                suffix="元"
                density="compact"
                variant="outlined"
                :placeholder="estimatedFeeText"
                @input="calculateTotalCost"
              />

              <!-- 交易稅 (僅賣出時顯示) -->
              <div
                v-if="formData.direction === 'SELL'"
              >
                <v-text-field
                  v-model="formData.tax"
                  label="交易稅"
                  type="number"
                  step="1"
                  min="0"
                  suffix="元"
                  density="compact"
                  variant="outlined"
                  :placeholder="estimatedTaxText"
                  @input="calculateTotalCost"
                />
              </div>

              <v-divider class="my-3" />
              
              <!-- 總成本/實收金額 -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6">{{ formData.direction === 'BUY' ? '總成本' : '實收金額' }}:</span>
                <span
                  class="text-h6 font-weight-bold"
                  :class="totalCostColor"
                >
                  {{ formatCurrency(calculatedTotalCost) }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          :disabled="!formValid"
          @click="submitTrade"
        >
          新增交易
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTradingData } from '@/composables/useTradingData';
import { useStockDetail } from '@/composables/useStockDetail';
import { TradingCalculator } from '@/utils/tradingCalculator';
import { DateUtils } from '@/utils/dateUtils';
import type { TradeDirection, TradingFeeResult } from '@/types/trading';

const emit = defineEmits<{
  'trade-added': [];
}>();
// Props & Emits
const modelValue = defineModel<boolean>({ required: true });
// Composables
const { addTrade } = useTradingData();
const { stockInfo, loadStockDetail } = useStockDetail();

// Form 相關
const formRef = ref();
const formValid = ref(false);
const loading = ref(false);

// 表單資料
const formData = ref({
  ticker: '',
  traded_at: DateUtils.getCurrentISOString().slice(0, 10), // date 格式 YYYY-MM-DD
  direction: 'BUY' as TradeDirection,
  price: '',
  quantity: 1,
  fee: '', // 空字串，使用 placeholder 顯示預估值
  tax: ''  // 空字串，使用 placeholder 顯示預估值
});

// 費用估算
const feeEstimate = ref<TradingFeeResult | null>(null);
const calculatedTotalCost = ref(0);

// 顯示在 placeholder 的文字
const estimatedFeeText = computed(() => {
  return feeEstimate.value ? `預估 ${feeEstimate.value.fee}` : '';
});

const estimatedTaxText = computed(() => {
  return feeEstimate.value ? `預估 ${feeEstimate.value.tax}` : '';
});

// 表單驗證規則
const tickerRules = [
  (v: string) => !!v || '請輸入股票代號',
  (v: string) => /^[A-Za-z0-9]+$/.test(v) || '請輸入有效的股票代號（只能包含英文字母和數字）'
];

const dateRules = [
  (v: string) => !!v || '請選擇交易時間'
];

// 移除 directionRules，因為 v-btn-toggle 的 mandatory 屬性會確保有選擇

const priceRules = [
  (v: string) => !!v || '請輸入價格',
  (v: string) => {
    const num = parseFloat(v);
    return !isNaN(num) && num > 0 || '請輸入有效價格';
  },
  (v: string) => {
    const decimalPlaces = (v.split('.')[1] || '').length;
    return decimalPlaces <= 2 || '價格最多只能到小數點第二位';
  }
];

const quantityRules = [
  (v: number) => v > 0 || '請輸入有效數量',
  (v: number) => Number.isInteger(v) || '數量必須為整數'
];

// 顯示費用計算區塊
const showFeeCalculation = computed(() => {
  const price = parseFloat(formData.value.price);
  return price > 0 && formData.value.quantity > 0;
});

// 總成本顏色
const totalCostColor = computed(() => {
  return formData.value.direction === 'BUY' ? 'text-error' : 'text-success';
});

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
  calculateFees();
};

// 計算總成本
const calculateTotalCost = () => {
  const price = parseFloat(formData.value.price);
  if (price > 0 && formData.value.quantity > 0) {
    const amount = price * formData.value.quantity;
    
    // 決定使用的手續費：使用者輸入值或預設計算值
    const actualFee = (formData.value.fee !== '' && formData.value.fee !== null && formData.value.fee !== undefined)
      ? parseFloat(formData.value.fee.toString())
      : (feeEstimate.value?.fee || 0);
    
    // 決定使用的交易稅：使用者輸入值或預設計算值
    const actualTax = (formData.value.tax !== '' && formData.value.tax !== null && formData.value.tax !== undefined)
      ? parseFloat(formData.value.tax.toString())
      : (feeEstimate.value?.tax || 0);
    
    if (formData.value.direction === 'BUY') {
      // 買入：金額 + 手續費
      calculatedTotalCost.value = amount + actualFee;
    } else {
      // 賣出：金額 - 手續費 - 交易稅
      calculatedTotalCost.value = amount - actualFee - actualTax;
    }
  } else {
    calculatedTotalCost.value = 0;
  }
};

// 計算費用（僅計算預估值，不自動填入）
const calculateFees = () => {
  const price = parseFloat(formData.value.price);
  if (price > 0 && formData.value.quantity > 0) {
    feeEstimate.value = TradingCalculator.estimateFees(
      price,
      formData.value.quantity,
      formData.value.direction
    );
    
    // 計算總成本
    calculateTotalCost();
  }
};

// 監聽買賣方向變化，重新計算費用
watch(
  () => [formData.value.direction, formData.value.price, formData.value.quantity],
  () => {
    if (formData.value.direction === 'BUY') {
      formData.value.tax = '0'; // 買入沒有交易稅
    }
    calculateFees();
  }
);

// 監聽數量變化，重新計算總成本
watch(() => formData.value.quantity, () => {
  calculateTotalCost();
});

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

// 格式化貨幣
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};

// 更新 model value
const updateModelValue = (value: boolean) => {
  modelValue.value = value;
};

// 關閉對話框
const closeDialog = () => {
  resetForm();
  updateModelValue(false);
};

// 重置表單
const resetForm = () => {
  formData.value = {
    ticker: '',
    traded_at: DateUtils.getCurrentISOString().slice(0, 10), // date 格式
    direction: 'BUY',
    price: '',
    quantity: 1,
    fee: '', // 重置為空字串
    tax: ''  // 重置為空字串
  };
  feeEstimate.value = null;
  calculatedTotalCost.value = 0;
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
      : (feeEstimate.value?.fee || 0);
    
    const finalTax = (formData.value.tax !== '' && formData.value.tax !== null && formData.value.tax !== undefined)
      ? parseFloat(formData.value.tax.toString())
      : (feeEstimate.value?.tax || 0);
    
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
      emit('trade-added');
      closeDialog();
    }
  } catch (error) {
    console.error('新增交易失敗:', error);
  } finally {
    loading.value = false;
  }
};
</script>