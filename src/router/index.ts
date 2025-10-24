import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          redirect: '/watchlist'
        },
        {
          path: 'watchlist',
          name: 'watchlist',
          component: () => import('../pages/watchlist/WatchlistPage.vue'),
          meta: { title: '自選股' }
        },
        {
          path: 'trading',
          name: 'trading',
          component: () => import('../pages/trading/TradingListPage.vue'),
          meta: { title: '交易紀錄' }
        }
      ]
    }
  ]
});