<template>
  <v-app>
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <v-main>
      <router-view />
    </v-main>
    
    <!-- Bottom Navigation -->
    <BottomNav />
  </v-app>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import BottomNav from './components/BottomNav.vue';
</script>

<style scoped>
.v-main {
  margin-bottom: 100px;
}
</style>