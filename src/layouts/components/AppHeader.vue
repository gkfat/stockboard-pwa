<template>
  <v-app-bar
    :elevation="2"
    color="primary"
    dark
    fixed
    app
  >
    <v-app-bar-title class="d-flex align-center">
      <v-icon class="me-2">
        mdi-chart-line
      </v-icon>
      <span class="font-weight-bold">股票看板</span>
    </v-app-bar-title>

    <v-spacer />

    <!-- 市場狀態指示器 -->
    <v-chip
      :color="marketStatusColor"
      :text="marketStatusText"
      size="small"
      class="me-2"
    />
    
    <!-- 更新狀態指示器 -->
    <v-btn
      v-if="hasUpdate"
      icon="mdi-download"
      variant="text"
      size="small"
      color="warning"
      class="me-1"
      @click="showPwaInfo = true"
    >
      <v-icon>mdi-download</v-icon>
      <v-tooltip
        activator="parent"
        location="bottom"
      >
        有新版本可更新
      </v-tooltip>
    </v-btn>
    
    <!-- PWA 說明按鈕 -->
    <v-btn
      icon="mdi-help-circle-outline"
      variant="text"
      size="small"
      @click="showPwaInfo = true"
    />
  </v-app-bar>

  <!-- PWA 資訊對話框 -->
  <v-dialog
    v-model="showPwaInfo"
    max-width="500px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon
          class="me-2"
          color="primary"
        >
          mdi-cellphone-cog
        </v-icon>
        PWA 應用程式
      </v-card-title>
      
      <v-card-text>
        <div class="mb-4">
          <h3 class="text-h6 mb-2">
            本網頁適合作為 PWA 使用
          </h3>
          <p class="text-body-2 text-grey">
            Progressive Web App (PWA) 讓您可以像使用原生 App 一樣使用本網站，
            享受更好的體驗和效能。
          </p>
        </div>
        <v-alert
          type="warning"
          class="mb-4 pa-2"
        >
          <strong>重要提醒：</strong>
          若未加入主畫面，瀏覽器可能會自動清除您的資料（包含觀察清單和交易紀錄）。
        </v-alert>
        <h4 class="text-subtitle-1 mb-2">
          iOS 加到主畫面步驟：
        </h4>
        <ol class="text-body-2 pl-6">
          <li class="mb-1">
            <v-icon
              size="small"
              class="me-1"
            >
              mdi-share
            </v-icon>
            點擊 Safari 底部的「分享」按鈕
          </li>
          <li class="mb-1">
            <v-icon
              size="small"
              class="me-1"
            >
              mdi-plus-box
            </v-icon>
            選擇「加到主畫面」
          </li>
          <li class="mb-1">
            <v-icon
              size="small"
              class="me-1"
            >
              mdi-pencil
            </v-icon>
            編輯名稱（可選）
          </li>
          <li class="mb-1">
            <v-icon
              size="small"
              class="me-1"
            >
              mdi-check
            </v-icon>
            點擊「新增」完成
          </li>
        </ol>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          color="primary"
          variant="outlined"
          rounded="md"
          :prepend-icon="hasUpdate ? 'mdi-download' : 'mdi-refresh'"
          :loading="isUpdating"
          @click="reloadForUpdate"
        >
          {{ hasUpdate ? '立即更新' : '檢查更新' }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="text"
          @click="showPwaInfo = false"
        >
          我知道了
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMarketTime } from '@/composables/useMarketTime';

const { isMarketOpen } = useMarketTime();
const showPwaInfo = ref(false);
const hasUpdate = ref(false);
const isUpdating = ref(false);
const lastUpdateCheck = ref<Date | null>(null);

// Service Worker 手動管理
let updateSW: (() => Promise<void>) | null = null;

// 檢查並註冊 Service Worker (僅在生產環境)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('✅ Service Worker 已註冊');
      
      // 監聽更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 有新版可以更新');
              hasUpdate.value = true;
            }
          });
        }
      });
      
      // 定期檢查更新 (每 30 秒)
      setInterval(() => {
        console.log('🔍 檢查更新中...');
        registration.update();
        lastUpdateCheck.value = new Date();
      }, 30000);
      
      // 設定更新函數
      updateSW = async () => {
        const waitingWorker = registration.waiting;
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          return new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              resolve();
            }, { once: true });
          });
        }
      };
    })
    .catch((error) => {
      console.error('❌ Service Worker 註冊失敗:', error);
    });
} else if (!import.meta.env.PROD) {
  console.log('🔧 開發環境：Service Worker 已停用');
}

// 市場狀態顯示
const marketStatusColor = computed(() => {
  return isMarketOpen.value ? 'success' : 'warning';
});

const marketStatusText = computed(() => {
  return isMarketOpen.value ? '開市中' : '未開市';
});

const reloadForUpdate = async () => {
  isUpdating.value = true;
  try {
    if (hasUpdate.value && updateSW) {
      // 有更新時：啟用新 SW 並重新載入
      await updateSW();
      window.location.reload();
    } else {
      // 沒有更新時：手動檢查更新
      if ('serviceWorker' in navigator && import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          lastUpdateCheck.value = new Date();
          console.log('✅ 更新檢查完成');
        }
      } else if (!import.meta.env.PROD) {
        // 開發環境模擬更新檢查
        console.log('🔧 開發環境：模擬更新檢查');
        lastUpdateCheck.value = new Date();
      }
    }
  } catch (error) {
    console.error('❌ 更新失敗:', error);
  } finally {
    isUpdating.value = false;
  }
};

</script>

<style scoped>
.v-app-bar-title {
  font-size: 1.2rem;
}

.v-chip {
  font-size: 0.75rem;
}
</style>