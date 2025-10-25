<template>
  <router-view />
  
  <!-- PWA 更新通知 -->
  <PWAUpdateNotification />
</template>

<script setup lang="ts">
import PWAUpdateNotification from '@/components/PWAUpdateNotification.vue';
</script>