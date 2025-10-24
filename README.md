# StockBoard PWA

Vue3 台股即時自選股觀察 PWA

## 功能特色

- 🚀 **PWA 應用**：可安裝至桌面或手機，支援離線使用
- 📈 **即時更新**：每10秒自動更新台股報價（僅開市時間）
- 📊 **走勢圖表**：顯示當日價格與成交量走勢
- ⭐ **自選股管理**：收藏個人關注的股票清單
- 🎨 **Material Design**：使用 Vuetify 打造現代化 UI

## 技術棧

- **前端框架**：Vue 3 + TypeScript
- **建構工具**：Vite
- **包管理器**：pnpm
- **UI 框架**：Vuetify (Material Design 3)
- **狀態管理**：Pinia
- **資料庫**：Dexie (IndexedDB)
- **圖表庫**：Chart.js
- **PWA**：Vite PWA Plugin

## 快速開始

### 安裝依賴

```bash
pnpm install
```

### 開發模式

```bash
# 啟動 HTTPS 開發服務器
pnpm dev

# 服務器將在 https://localhost:3000 啟動
# 如需訪問網路上的其他設備，使用 https://[your-ip]:3000
```

### HTTPS 證書設定

```bash
# 產生受信任的本地 HTTPS 證書（推薦）
pnpm cert:generate

# 需要先安裝 mkcert：
# macOS: brew install mkcert
# Ubuntu: apt install mkcert
```

**證書說明：**
- 🔒 **有自定義證書**：瀏覽器完全信任，無安全警告
- ⚠️ **無自定義證書**：使用 Vite 內建自簽證書，瀏覽器會顯示安全警告（可安全忽略）

### 建構生產版本

```bash
pnpm build
```

### 預覽生產版本

```bash
pnpm preview
```

### 清理依賴快取

```bash
pnpm clean
```

### 程式碼檢查與修復

```bash
# 檢查程式碼風格
pnpm lint:check

# 自動修復程式碼風格
pnpm lint
```

## 專案結構

```
src/
├── components/          # Vue 組件
│   ├── StockCard.vue           # 股票卡片
│   ├── StockChart.vue          # 股票圖表
│   └── AddStockDialog.vue      # 新增股票對話框
├── composables/         # 組合式 API
│   ├── useStock.ts             # 股票 API 邏輯
│   ├── useWatchlist.ts         # 自選股管理
│   └── useMarketTime.ts        # 開市時間判斷
├── stores/              # Pinia 狀態管理
│   └── stockStore.ts           # 股票狀態 store
├── types/               # TypeScript 類型定義
│   └── stock.ts               # 股票相關類型
├── db/                  # 資料庫
│   └── stockDB.ts             # Dexie 資料庫設定
└── views/               # 頁面視圖
    └── HomeView.vue           # 主頁面
```

## 資料來源

- **台灣證交所 API**：`https://mis.twse.com.tw/stock/api/getStockInfo.jsp`
- **開市時間**：週一至週五 09:00-13:30

## 注意事項

- 本應用僅供參考，投資決策請自行承擔風險
- API 資料可能有延遲，請以官方資料為準
- 離線模式下顯示最後一次更新的資料

## License

MIT