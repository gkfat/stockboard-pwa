<template>
  <v-dialog
    v-model="showDialog"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title>
        <v-icon class="me-2">
          mdi-plus-circle
        </v-icon>
        新增自選股
      </v-card-title>

      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
          @submit.prevent="addStock"
        >
          <v-text-field
            v-model="stockCode"
            label="股票代號"
            placeholder="例：2330"
            :rules="stockCodeRules"
            :loading="loading"
            :error-messages="errorMessage"
            variant="outlined"
            clearable
            autofocus
          >
            <template #append-inner>
              <v-btn
                icon="mdi-magnify"
                variant="text"
                size="small"
                :loading="loading"
                @click="searchStock"
              />
            </template>
          </v-text-field>

          <!-- 搜尋結果 -->
          <v-card
            v-if="searchResult"
            variant="tonal"
            class="mt-4"
          >
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h6">
                    {{ searchResult.name }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ searchResult.code }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-h6">
                    {{ formatPrice(searchResult.price) }}
                  </div>
                  <v-chip
                    :color="getPnLColor(searchResult.change)"
                    size="small"
                  >
                    {{ formatChange(searchResult.change) }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

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
          :disabled="!valid || !searchResult"
          :loading="adding"
          @click="addStock"
        >
          新增
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStock } from '@/composables/useStock';
import { useWatchlistState } from '@/composables/useWatchlistState';
import { FormatUtil } from '@/utils/formatUtil';
import { useWatchlistActions } from '@/composables/useWatchlistActions';
import type { StockInfo } from '@/types/stock';
import { PnLUtil } from '@/utils/pnlUtil';

const emit = defineEmits<{
  'added': []
}>();

const showDialog = defineModel<boolean>();

// 取得損益顏色 - 使用 PnLUtil 統一邏輯
const getPnLColor = PnLUtil.getPnLColor;

// Composables
const { fetchMultipleStocks } = useStock();
const { isInWatchlist } = useWatchlistState();
const { addStock: addStockToWatchlist } = useWatchlistActions();

// 響應式狀態
const form = ref();
const valid = ref(false);
const stockCode = ref('');
const loading = ref(false);
const adding = ref(false);
const errorMessage = ref('');
const searchResult = ref<StockInfo | null>(null);

// 驗證規則
const stockCodeRules = [
  (v: string) => !!v || '請輸入股票代號',
  (v: string) => !isInWatchlist(v) || '此股票已在自選股清單中'
];

// 方法
const searchStock = async () => {
  if (!stockCode.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  searchResult.value = null;

  try {
    const result = await fetchMultipleStocks([stockCode.value]);
    if (result?.length) {
      searchResult.value = result[0];
    } else {
      errorMessage.value = '查無此股票代號';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '搜尋失敗';
  } finally {
    loading.value = false;
  }
};

const addStock = async () => {
  if (!searchResult.value) return;

  adding.value = true;
  
  try {
    const success = await addStockToWatchlist(
      searchResult.value.code,
      searchResult.value.name
    );
    
    if (success) {
      emit('added');
      closeDialog();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '新增失敗';
  } finally {
    adding.value = false;
  }
};

const closeDialog = () => {
  showDialog.value = false;
  stockCode.value = '';
  searchResult.value = null;
  errorMessage.value = '';
  if (form.value) {
    form.value.reset();
  }
};

// 格式化函數
const { formatPrice, formatChange } = FormatUtil;

// 監聽股票代號變化，自動搜尋
watch(stockCode, (newCode) => {
  if (newCode && newCode.trim().length > 0) {
    searchStock();
  } else {
    searchResult.value = null;
    errorMessage.value = '';
  }
});
</script>