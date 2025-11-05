import { ref, computed } from 'vue';
import { DateUtils } from '@/utils/dateUtils';
import type { Dayjs } from 'dayjs';
import { INTERVAL_SECONDS } from '@/constants';

export function useMarketTime() {
  const currentTime = ref<Dayjs>(DateUtils.now());

  // 啟動時間更新器
  const startTimeUpdater = () => {
    setInterval(() => {
      // 更新當前時間
      currentTime.value = DateUtils.now();
    }, INTERVAL_SECONDS);
  };
  
  return {
    currentTime,
    // 判斷是否為開市時間
    isMarketOpen: ref(true),
    // isMarketOpen: computed(() => DateUtils.isMarketOpen(currentTime.value)),
    startTimeUpdater
  };
}