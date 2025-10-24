import { computed, onMounted } from 'vue';
import { watchlistService } from '@/services/watchlistService';

/**
 * 觀察清單狀態 Composable - 純粹提供響應式狀態存取
 * 職責：提供 Vue 響應式介面，不直接操作 service
 */
export function useWatchlistState() {
  // 響應式狀態（直接暴露 service 的響應式狀態）
  const watchlist = computed(() => watchlistService.watchlist.value);
  const loading = computed(() => watchlistService.loading.value);
  const error = computed(() => watchlistService.error.value);
  const stockCodes = computed(() => watchlistService.stockCodes);

  // 計算屬性
  const isEmpty = computed(() => watchlist.value.length === 0);
  const stockCount = computed(() => watchlist.value.length);

  // 檢查股票是否在觀察清單中
  const isInWatchlist = (code: string): boolean => {
    return watchlistService.isInWatchlist(code);
  };

  // 自動初始化（組件掛載時）
  onMounted(() => {
    if (watchlist.value.length === 0) {
      watchlistService.initialize();
    }
  });

  return {
    // 響應式狀態
    watchlist,
    loading,
    error,
    stockCodes,
    isEmpty,
    stockCount,
    
    // 查詢方法
    isInWatchlist
  };
}