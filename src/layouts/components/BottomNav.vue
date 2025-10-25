<template>
  <v-bottom-navigation
    v-model="activeTab"
    fixed
    app
    :elevation="8"
    height="80"
  >
    <v-btn
      value="watchlist"
      @click="goToRoute('/watchlist')"
    >
      <v-badge
        :content="watchlistCount"
        :model-value="watchlistCount > 0"
        color="primary"
        overlap
      >
        <v-icon>mdi-star</v-icon>
      </v-badge>
      <span>觀察清單</span>
    </v-btn>
    
    <v-btn
      value="trading"
      @click="goToRoute('/trading')"
    >
      <v-icon>mdi-chart-line</v-icon>
      <span>交易紀錄</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useWatchlistState } from '@/composables/useWatchlistState';

const router = useRouter();
const route = useRoute();
const { watchlist } = useWatchlistState();

// 當前活躍的標籤
const activeTab = ref('watchlist');

// 自選股數量
const watchlistCount = computed(() => watchlist.value.length);

// 根據當前路由設定活躍標籤
const updateActiveTab = () => {
  const path = route.path;
  
  if (path.startsWith('/watchlist')) {
    activeTab.value = 'watchlist';
  } else if (path.startsWith('/trading')) {
    activeTab.value = 'trading';
  }
};

// 監聽路由變化
watch(() => route.path, updateActiveTab, { immediate: true });

// 導航方法
const goToRoute = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};
</script>

<style scoped>
.v-bottom-navigation {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-btn {
  flex-direction: column;
  height: 56px;
}

.v-btn span {
  font-size: 0.75rem;
  margin-top: 2px;
}
</style>