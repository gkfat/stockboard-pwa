import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import weekday from 'dayjs/plugin/weekday';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// 設定 dayjs 外掛和語系
dayjs.extend(weekday);
dayjs.extend(advancedFormat);
dayjs.locale('zh-tw');

/**
 * 日期工具函數
 * 依據 spec.md 要求使用 dayjs 套件
 */
export class DateUtils {
  /**
   * 格式化最後更新時間
   * Format: 'YYYY/MM/DD HH:mm:ss 星期二'
   */
  static formatLastUpdateTime(date: string | Date): string {
    const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayjsDate = dayjs(date);
    
    if (!dayjsDate.isValid()) {
      return '未取得更新時間';
    }
    
    const formattedDate = dayjsDate.format('YYYY/MM/DD');
    const formattedTime = dayjsDate.format('HH:mm:ss');
    const weekdayIndex = dayjsDate.day();
    
    return [formattedDate,dayOfWeek[weekdayIndex], formattedTime].join(' ');
  }

  /**
   * 格式化交易時間 (ISO string 轉顯示格式)
   */
  static formatTradeTime(isoString: string): string {
    return dayjs(isoString).format('YYYY/MM/DD HH:mm');
  }

  /**
   * 取得當前時間的 ISO string
   */
  static getCurrentISOString(): string {
    return dayjs().toISOString();
  }

  /**
   * 檢查是否為今天
   */
  static isToday(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
  }

  static createDate() {
    return dayjs();
  }

  /**
   * 格式化日期為 YYYY-MM-DD 格式
   */
  static formatDate(date: string | Date): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * 取得日期範圍（用於查詢）
   */
  static getDateRange(days: number): { startDate: string; endDate: string } {
    const endDate = dayjs();
    const startDate = endDate.subtract(days, 'day');
    
    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    };
  }
}