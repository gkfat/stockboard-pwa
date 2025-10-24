<template>
  <v-app>
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <v-main>
      <v-container
        fluid
        class="pa-0"
      >
        <router-view />
      </v-container>
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
  padding-bottom: 56px; /* 為 bottom navigation 預留空間 */
}
</style>