# cameo-gallery

純靜態圖庫網頁，零依賴、零建構。Git push 後 Cloudflare Pages 自動部署。

- **正式網址**：https://cameo-gallery.pages.dev（Cloudflare Pages 接好後生效）
- **點圖片** → 複製圖片網址（含 toast 提示）
- **點放大鏡** → 看大圖（lightbox，鍵盤左右切換、ESC 關閉）

## 使用流程

### 1. 放圖
把圖片丟進 `images/` 資料夾。支援 `.jpg .jpeg .png .gif .webp .svg .avif .heic`。

> 檔名會直接顯示成標題，建議用有意義的名字：
> `01-課程簡介.jpg` → 顯示「01-課程簡介」

### 2. 掃描
```bash
./build.sh
```
會自動產生 `images.json`（圖片清單），順便清掉 `.DS_Store`。

### 3. 預覽（可選）
```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

### 4. 發佈
```bash
git add -A
git commit -m "新增 XX 圖片"
git push
```
Cloudflare Pages 偵測到 push 後自動部署，30 秒內上線。

## 夥伴專區（/onboarding，密碼保護）

`/onboarding/` 是給卡米爾內部夥伴的入口頁，公開圖庫不受影響。登入一次，cookie 涵蓋整個 `/onboarding/*`。

- **網址**：https://cameo-gallery.pages.dev/onboarding/
- **入口頁**：`onboarding/index.html` 是資源清單（清單／卡片可切換，選擇存 localStorage）。
- **隱藏入口**：首頁標題「教學素材庫」**1.5 秒內連點三下** → 跳到 `/onboarding/`（再經密碼門）。首頁外觀完全不變。
- **保護方式**：Cloudflare Pages Functions 伺服器端密碼門（`functions/onboarding/_middleware.js`）。沒輸對通行碼，內容根本不會送到瀏覽器；驗證成功後種 HMAC 簽章 cookie，30 天免重輸。深連結也支援（直接開子頁 → 登入後回到該子頁）。
- **設密碼**：到 Cloudflare 後台 → 該 Pages 專案 → **Settings → Variables and Secrets** → 新增環境變數 `ONBOARDING_PASSCODE`，值設成你要的通行碼，類型選 **Secret**，存到 **Production**。改完要重新部署一次才生效。
- **換密碼**：改 `ONBOARDING_PASSCODE` 的值即可，所有舊 cookie 自動失效（夥伴需重輸新碼）。
- ⚠️ 通行碼**不要**寫進 repo，只放環境變數。

### 加一頁新的夥伴資源
1. 建資料夾 `onboarding/<名稱>/index.html`（例：`onboarding/contract/`）
2. 在 `onboarding/index.html` 的 `ENTRIES` 陣列加一筆 `{ icon, title, desc, href:'<名稱>/' }`
3. 完成。密碼門自動罩住新頁，瀏覽計數也自動納入，不用改任何設定。

## 使用統計（全自動，存在 Cloudflare KV）

- **看數字**：夥伴專區入口頁 footer →「📊 使用統計」→ `/onboarding/stats`（鎖在密碼門後，私密）。
- **怎麼記**：`functions/_middleware.js` 伺服器端自動數每個「成功打開的網頁」，零頁面程式。只算 200 的 HTML，略過 401、圖片、爬蟲、POST、統計頁自己。新頁自動納入。
- **存哪**：Cloudflare KV，鍵 `p:<網址>` → 值為次數。不放 cookie、不進 git。
- **一次性設定**：到 Cloudflare 建一個 KV namespace，綁到此 Pages 專案，**綁定名稱必須是 `VIEWS`**（Settings → Functions / Bindings → KV namespace bindings）。沒綁也不會壞（fail-safe，只是先不記數）。
- **起算日**：`functions/onboarding/stats.js` 的 `SINCE` 常數（目前 `2026/6/7`）。
- 想看別的頁面好名稱，編 `stats.js` 的 `LABELS` 對照表即可。

## 檔案結構

```
cameo-gallery/
├── index.html                       # 主頁面（相片牆 + lightbox + 點圖複製網址）
├── images.json                      # 圖片清單（自動產生，勿手改）
├── images/                          # 圖片放這裡
├── onboarding/
│   ├── index.html                   # 夥伴專區入口頁（清單/卡片切換）
│   └── checklist/index.html         # 課前作業檢核表
├── functions/
│   ├── _middleware.js               # 全站瀏覽計數（伺服器端自動記到 KV）
│   └── onboarding/
│       ├── _middleware.js           # /onboarding/* 的伺服器端密碼門
│       └── stats.js                 # 使用統計儀表板（/onboarding/stats，密碼保護）
├── build.sh                         # 掃描工具
├── 原始/                            # 原圖備份（.gitignore 排除，不入 repo）
└── README.md
```

## Cloudflare Pages 設定

| 欄位 | 值 |
|------|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | （留空） |
| Build output directory | （留空，根目錄就是部署目錄） |

## 特色

- 響應式：手機 2 欄、桌機自動排版
- 點圖複製網址 + toast 提示 + 圖框閃綠光
- Lightbox：點放大鏡進入，左右鍵切換、ESC 關閉
- 中文檔名自動 URL encode
- 零依賴、純 HTML/CSS/Vanilla JS
