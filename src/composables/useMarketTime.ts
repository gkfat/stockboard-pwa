import { ref, computed } from 'vue';
import { TAIWAN_MARKET_TIME } from '@/constants';

export function useMarketTime() {
  const currentTime = ref(new Date());

  // 更新當前時間
  const updateTime = () => {
    currentTime.value = new Date();
  };

  // 判斷是否為開市時間
  const isMarketOpen = computed(() => {
    const now = currentTime.value;
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 週一到週五 09:00–13:30
    const isWeekday = day >= TAIWAN_MARKET_TIME.MONDAY && day <= TAIWAN_MARKET_TIME.FRIDAY;
    const isInTradingHours = timeInMinutes >= TAIWAN_MARKET_TIME.TRADING_START && timeInMinutes <= TAIWAN_MARKET_TIME.TRADING_END;

    return isWeekday && isInTradingHours;
  });

  // 取得市場狀態文字
  const marketStatus = computed(() => {
    return isMarketOpen.value ? '開市中' : '休市中';
  });

  // 取得下次開市時間
  const nextMarketOpen = computed(() => {
    const now = currentTime.value;
    const nextOpen = new Date(now);
    
    if (now.getDay() === TAIWAN_MARKET_TIME.SUNDAY) { // 週日
      nextOpen.setDate(now.getDate() + 1);
    } else if (now.getDay() === TAIWAN_MARKET_TIME.SATURDAY) { // 週六
      nextOpen.setDate(now.getDate() + 2);
    } else if (!isMarketOpen.value) { // 平日但非開市時間
      if (now.getHours() >= TAIWAN_MARKET_TIME.AFTERNOON_CUTOFF) { // 下午2點後，下個交易日
        nextOpen.setDate(now.getDate() + 1);
      }
    }
    
    nextOpen.setHours(9, 0, 0, 0);
    return nextOpen;
  });

  // 啟動時間更新器
  const startTimeUpdater = () => {
    setInterval(updateTime, 30000); // 每30秒更新一次
  };

  return {
    currentTime,
    isMarketOpen,
    marketStatus,
    nextMarketOpen,
    updateTime,
    startTimeUpdater
  };
}