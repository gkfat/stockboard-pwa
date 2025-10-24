import { useWatchlistState } from './useWatchlistState';
import { useWatchlistActions } from './useWatchlistActions';

/**
 * 觀察清單操作 - 向後相容的 API 包裝器
 * 組合 state 和 actions composables
 * @deprecated 請直接使用 useWatchlistState 和 useWatchlistActions
 */
export function useWatchlist() {
  const state = useWatchlistState();
  const actions = useWatchlistActions();

  return {
    // 狀態 (向後相容)
    watchlist: state.watchlist,
    loading: state.loading,
    error: state.error,
    
    // 方法 (向後相容)
    loadWatchlist: actions.initializeWatchlist,
    addStock: actions.addStock,
    removeStock: actions.removeStock,
    isInWatchlist: state.isInWatchlist,
    getStockCodes: () => state.stockCodes.value
  };
}