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
    <v-card class="py-2 px-5">
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
          variant="outlined"
          class="mb-4"
        >
          <strong>重要提醒：</strong>
          若未加入主畫面，瀏覽器可能會自動清除您的資料（包含觀察清單和交易紀錄）。
        </v-alert>
        <h4 class="text-subtitle-1 mb-2">
          iOS 加到主畫面步驟：
        </h4>
        <ol class="text-body-2">
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

      <v-card-actions>
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

// 市場狀態顯示
const marketStatusColor = computed(() => {
  return isMarketOpen.value ? 'success' : 'warning';
});

const marketStatusText = computed(() => {
  return isMarketOpen.value ? '開市中' : '未開市';
});

</script>

<style scoped>
.v-app-bar-title {
  font-size: 1.2rem;
}

.v-chip {
  font-size: 0.75rem;
}
</style>