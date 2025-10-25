import { ref, computed } from 'vue';

/**
 * PWA 更新管理
 * 提供更新檢查、通知和控制功能
 */
export function usePWAUpdate() {
  // 手動管理 PWA 狀態 (不依賴 virtual:pwa-register/vue)
  const offlineReady = ref(false);
  const needRefresh = ref(false);
  
  // 檢查是否支援 Service Worker
  if ('serviceWorker' in navigator) {
    // 監聽 SW 更新事件
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      needRefresh.value = true;
    });
    
    // 檢查離線狀態
    window.addEventListener('online', () => {
      offlineReady.value = false;
    });
    
    window.addEventListener('offline', () => {
      offlineReady.value = true;
    });
  }

  // 更新狀態
  const isUpdateAvailable = computed(() => needRefresh.value);
  const isOfflineReady = computed(() => offlineReady.value);
  const isUpdating = ref(false);

  /**
   * 執行更新
   */
  const update = async () => {
    if (!needRefresh.value) return;
    
    isUpdating.value = true;
    try {
      // 重新載入頁面以獲取最新版本
      window.location.reload();
    } catch (error) {
      console.error('更新失敗:', error);
    } finally {
      isUpdating.value = false;
    }
  };

  /**
   * 延遲更新 (關閉通知但不更新)
   */
  const dismissUpdate = () => {
    // 暫時隱藏更新通知，下次啟動時會再次檢查
    needRefresh.value = false;
  };

  /**
   * 手動檢查更新
   */
  const checkForUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  };

  return {
    // 狀態
    isUpdateAvailable,
    isOfflineReady,
    isUpdating,
    
    // 方法
    update,
    dismissUpdate,
    checkForUpdate,
  };
}