1. 觀察清單(自選股)

- 用戶可將股票加入觀察清單, 也可從觀察清單移除, 觀察清單會操作 indexedDB
- 觀察清單頁面頂端顯示最後更新時間, 使用 dayjs 套件, format 'YYYY/MM/DD HH:mm:ss 星期二'
- 觀察清單 Item 以 100% 寬(sm 以上 300px)的卡片條列, 每張卡片列出 股票代碼/名稱/當日成交量/現價或昨收(開市用現價,非開市用作收)/漲跌幅(紅漲綠跌)
- 觀察清單 Item 點擊後會進入 stock/detail 頁面, 顯示該股票詳細股價/成交量/漲跌等資訊, 並以 highcharts library 畫出走勢圖

2. 交易紀錄

- 用戶可新增交易紀錄, 可紀錄的欄位有 ticker, traded_at(ISO time string), direction(BUY/SELL), price, quantity, tax(交易稅, 買不會有,賣出才有,), fee(手續費)
- 新增一個交易紀錄列表頁, 以股票代號為 group, 即時計算個別已實現/未實現損益, 列表下方固定一個已實現/未實現總損益, 須預估手續費與交易稅(套用台灣公式)

3. 其他

- 觀察清單存在 indexedDB, fallback to localStorage
- app init 並 init watchlist 後，須先打一次 API 取得所有股票的現價/昨收, 另外異步呼叫定時更新 updater
- header 顯示一個問號, 點開後彈出資訊卡片, 說明本網頁適合 PWA, 列出 ios 加到主畫面的步驟, 若未加入主畫面, 會有可能被瀏覽器自動清除資料
- 建立一個 TWSEApiService, 包裝對 TWSE api 的操作
- types/twse-api.ts 定義相關的 API request & response
- 包裝一個 axios agent, 打 api 時呼叫這個 agent 來建立 API request
- 使用 SOLID 原則但不需過頭, 每個 composables 負責單一職責, 不要過多複雜邏輯(例如操作其他 composables)
- vue component 優先使用 defineModel, 盡量少用 props & emit 老舊寫法
