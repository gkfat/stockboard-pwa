export class StockUtil {
  static getChangeColor(change: number): 'error'|'success'|'grey' {
    if (change > 0) return 'error';  // 漲紅
    if (change < 0) return 'success'; // 跌綠
    return 'grey';
  }
}