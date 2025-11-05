import { ref, computed } from 'vue';
import { DateUtils } from '@/utils/dateUtils';
import type { Dayjs } from 'dayjs';

export function useMarketTime() {
  const currentTime = ref<Dayjs>(DateUtils.now());

  // 更新當前時間
  const updateTime = () => {
    currentTime.value = DateUtils.now();
  };
  
  // 啟動時間更新器
  const startTimeUpdater = () => {
    setInterval(updateTime, 30 * 1000); // 每30秒更新一次
  };
  
  return {
    currentTime,
    // 判斷是否為開市時間
    isMarketOpen: computed(() => DateUtils.isMarketOpen(currentTime.value)),
    updateTime,
    startTimeUpdater
  };
}