<template>
  <v-snackbar
    v-model="showUpdateSnackbar"
    :timeout="-1"
    location="bottom"
    color="primary"
    elevation="8"
  >
    <div class="d-flex align-center">
      <v-icon class="me-2">mdi-download</v-icon>
      <span>發現新版本，建議立即更新</span>
    </div>

    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="dismissUpdate"
      >
        稍後
      </v-btn>
      <v-btn
        variant="tonal"
        color="white"
        :loading="isUpdating"
        @click="update"
      >
        立即更新
      </v-btn>
    </template>
  </v-snackbar>

  <!-- 離線就緒通知 -->
  <v-snackbar
    v-model="showOfflineSnackbar"
    timeout="4000"
    location="bottom"
    color="success"
  >
    <div class="d-flex align-center">
      <v-icon class="me-2">mdi-wifi-off</v-icon>
      <span>應用程式已可離線使用</span>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePWAUpdate } from '@/composables/usePWAUpdate';

const {
  isUpdateAvailable,
  isOfflineReady,
  isUpdating,
  update,
  dismissUpdate: dismissPWAUpdate,
} = usePWAUpdate();

// 控制 Snackbar 顯示
const showUpdateSnackbar = ref(false);
const showOfflineSnackbar = ref(false);

// 監聽更新狀態
watch(isUpdateAvailable, (available) => {
  if (available) {
    showUpdateSnackbar.value = true;
  }
});

// 監聽離線就緒狀態
watch(isOfflineReady, (ready) => {
  if (ready) {
    showOfflineSnackbar.value = true;
  }
});

// 自定義關閉更新通知
const dismissUpdate = () => {
  showUpdateSnackbar.value = false;
  dismissPWAUpdate();
};
</script>