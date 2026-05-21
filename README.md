# 教學素材庫（_img-gallery）

純靜態圖庫網頁，零依賴、零建構。

## 使用流程

### 1. 放圖
把圖片丟進 `upload_netlify/images/` 資料夾。支援 `.jpg .jpeg .png .gif .webp .svg .avif .heic`。

> 檔名會直接顯示成標題，建議用有意義的名字，例如：
> `01-課程簡介.jpg` → 顯示「01-課程簡介」

### 2. 掃描
```bash
./build.sh
```
會自動產生 `images.json`（圖片清單）。

### 3. 預覽（可選）
```bash
cd upload_netlify
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

### 4. 發佈到 Netlify
1. 開啟 [app.netlify.com](https://app.netlify.com)
2. 把 `upload_netlify/` 資料夾**拖到** Netlify 的「Sites」頁面（注意：不是外層的 _img-gallery）
3. 自動取得網址（例如：`https://xxx.netlify.app`）
4. 想換網址：Site settings → Change site name

## 檔案結構
```
_img-gallery/
├── build.sh                 # 掃描工具（在外層，不會被上傳）
├── README.md
└── upload_netlify/          ← 拖這個資料夾到 Netlify
    ├── index.html           # 主頁面（相片牆 + lightbox + 點圖複製網址）
    ├── images.json          # 圖片清單（自動產生，勿手改）
    └── images/              # 把圖片放這裡
```

> `build.sh` 和 `README.md` 故意留在外層，讓 `upload_netlify/` 保持乾淨，拖到 Netlify 上傳時不會夾帶開發用檔案。

## 特色
- 響應式：手機 2 欄、桌機自動排版
- Lightbox：點圖放大，左右鍵切換，ESC 關閉
- 鍵盤操作友善
- 零依賴、純 HTML/CSS/JS
