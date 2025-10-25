import { computed, type Ref } from 'vue';
import { TradeDirection } from '@/enums/trade-direction';
import { useTradingData } from '@/composables/useTradingData';

// 表單資料型別定義
interface FormData {
  ticker: string;
  traded_at: string;
  direction: TradeDirection;
  price: string;        // 表單中價格是字串
  quantity: number;
  fee: string;          // 表單中費用是字串
  tax: string;          // 表單中稅金是字串
}

/**
 * 交易表單驗證規則 Composable
 */
export function useTradeRules(formData: Ref<FormData>) {
  const { positions } = useTradingData();

  // 買入模式檢查
  const isBuy = computed(() => formData.value.direction === TradeDirection.BUY);

  // 股票代號驗證規則
  const tickerRules = [
    (v: string) => !!v || '請輸入股票代號',
    (v: string) => /^[A-Za-z0-9]+$/.test(v) || '請輸入有效的股票代號（只能包含英文字母和數字）'
  ];

  // 交易日期驗證規則
  const dateRules = [
    (v: string) => !!v || '請選擇交易時間'
  ];

  // 價格驗證規則
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

  // 數量驗證規則 (使用 computed 以便響應式更新)
  const quantityRules = computed(() => [
    (v: number) => v > 0 || '請輸入有效數量',
    (v: number) => Number.isInteger(v) || '數量必須為整數',
    (v: number) => {
      // 買入時不需要檢查持倉
      if (isBuy.value) {
        return true;
      }
      
      // 賣出時檢查持倉數量
      const ticker = formData.value.ticker.trim().toUpperCase();
      const position = positions.value.find(p => p.ticker === ticker);
      const currentHolding = position?.holdingQuantity || 0;
      
      if (v > currentHolding || currentHolding <= 0) {
        return `賣出數量不能超過持倉數量 (目前持有 ${currentHolding} 股)`;
      }
      
      return true;
    }
  ]);

  return {
    isBuy,
    tickerRules,
    dateRules,
    priceRules,
    quantityRules
  };
}