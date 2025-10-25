import { useWatchlistState } from '@/composables/useWatchlistState';

/**
 * 觀察清單表單驗證規則 Composable
 */
export function useWatchlistRules() {
  const { isInWatchlist } = useWatchlistState();

  // 股票代號驗證規則
  const tickerRules = [
    (v: string) => !!v || '請輸入股票代號',
    (v: string) => /^[A-Za-z0-9]+$/.test(v) || '請輸入有效的股票代號（只能包含英文字母和數字）',
    (v: string) => !isInWatchlist(v) || '此股票已在自選股清單中'
  ];

  return {
    tickerRules
  };
}