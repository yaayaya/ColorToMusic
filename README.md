# 🎨 ColorToMusic - 圖片轉音樂

一個創新的網頁應用程式，能夠將圖片的色彩轉換為美妙的音樂。通過分析每個像素的 RGB 值，計算亮度或鮮豔度，並將其映射到不同的音頻頻率，從而創造出獨特的音樂體驗。

## ✨ 功能特色

### 🖼️ 圖片處理
- **多格式支援**：支援 JPG、PNG 等常見圖片格式
- **拖拽上傳**：直覺的拖拽介面，簡單易用
- **即時預覽**：上傳後立即顯示圖片預覽
- **映射預覽**：即時顯示亮度/鮮豔度映射後的視覺效果

### 🎵 音樂轉換
- **兩種映射方式**：
  - **亮度模式**：使用感知亮度公式 `Y = 0.2126R + 0.7152G + 0.0722B`
  - **鮮豔度模式**：使用色彩距離公式 `√((R-G)² + (G-B)² + (B-R)²)`
- **多種掃描方向**：
  - 從左到右：逐行掃描
  - 從上到下：逐列掃描  
  - 對角線：對角線掃描
- **自訂參數**：
  - 頻率範圍：100Hz - 3520Hz
  - 音樂長度：1-60 秒
  - 像素跳躍：加速播放選項

### 🎧 音頻功能
- **即時播放**：使用 Web Audio API 進行高品質音頻播放
- **視覺化**：即時波形顯示和播放進度
- **音檔匯出**：支援 WAV 格式下載

### 🎛️ 使用者介面
- **響應式設計**：支援桌面和行動裝置
- **直覺操作**：簡潔易懂的控制介面
- **即時映射預覽**：視覺化顯示色彩轉換效果
- **鍵盤快捷鍵**：
  - `空白鍵`：播放/停止
  - `Ctrl + Enter`：產生音樂

## 🚀 快速開始

### 線上使用
1. 開啟 `index.html` 檔案於網頁瀏覽器中
2. 上傳或拖拽圖片到指定區域
3. 調整音樂參數（可選）
4. 點擊「產生音樂」按鈕
5. 享受您的圖片音樂！

### 本地開發
```bash
# 複製專案
git clone [repository-url]
cd ColorToMusic

# 使用本地伺服器（推薦）
# 方式 1: 使用 Python
python -m http.server 8000

# 方式 2: 使用 Node.js
npx http-server

# 方式 3: 使用 VS Code Live Server 擴充套件
```

然後在瀏覽器中開啟 `http://localhost:8000`

## 📁 專案結構

```
ColorToMusic/
├── index.html          # 主要 HTML 檔案
├── styles.css          # 樣式表
├── colorToMusic.js     # 核心音樂轉換邏輯
├── app.js             # 應用程式主控邏輯
└── README.md          # 專案說明文件
```

## 🧠 技術原理

### 色彩分析
每個像素的 RGB 值透過以下方法轉換為數值：

**亮度計算（感知亮度）：**
```javascript
brightness = 0.2126 × R + 0.7152 × G + 0.0722 × B
```

**鮮豔度計算（色彩距離）：**
```javascript
vividness = √((R-G)² + (G-B)² + (B-R)²)
```

### 音頻映射
數值線性映射到音頻頻率：
```javascript
frequency = minFreq + (value - minValue) / (maxValue - minValue) × (maxFreq - minFreq)
```

### 音頻合成
使用正弦波產生音調，並加入淡入淡出效果：
```javascript
sample = sin(2π × frequency × time) × volume × envelope
```

## 🎨 使用範例

### 建議的圖片類型
- **風景照片**：產生流暢的音樂漸變
- **抽象藝術**：創造複雜的音樂層次
- **黑白照片**：簡潔的音調變化
- **色彩豐富的圖片**：豐富的音樂變化

### 參數調整建議
- **明亮圖片**：建議使用鮮豔度模式
- **暗調圖片**：建議使用亮度模式  
- **大圖片**：增加像素跳躍以縮短處理時間
- **複雜圖片**：使用對角線掃描獲得有趣效果

## 🛠️ 技術規格

### 瀏覽器支援
- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

### 技術棧
- **前端**：純 HTML5、CSS3、JavaScript (ES6+)
- **音頻**：Web Audio API
- **圖片處理**：Canvas API
- **檔案處理**：File API

### 效能考量
- **記憶體使用**：圖片大小和音樂長度會影響記憶體使用
- **處理時間**：大圖片建議使用像素跳躍功能
- **音質**：44.1kHz 採樣率，16-bit 音質

## 🎯 使用案例

### 藝術創作
- 將視覺藝術轉換為聽覺體驗
- 創造多媒體藝術作品
- 探索色彩與音樂的關聯

### 教育用途
- 學習色彩理論
- 理解頻率和音調概念
- 探索數位藝術與科技

### 娛樂應用
- 為照片創造獨特配樂
- 社群分享有趣內容
- 個人創意實驗

## 🔧 自訂開發

### 擴充功能建議
- **更多掃描模式**：螺旋、隨機掃描
- **音效合成**：支援不同波形（方波、三角波等）
- **音樂理論**：調性、和弦對應
- **檔案格式**：MP3 匯出支援
- **批次處理**：多圖片處理

### API 介面
主要的 `ColorToMusic` 類別提供完整的 API：

```javascript
const colorToMusic = new ColorToMusic();

// 載入圖片
await colorToMusic.loadImage(imageFile);

// 轉換為音樂
const result = await colorToMusic.imageToSound(imageFile, options);

// 播放音樂
await colorToMusic.playAudio(progressCallback);

// 匯出音檔
await colorToMusic.exportToWAV(filename);
```

## 📝 授權條款

本專案採用 MIT 授權條款，歡迎自由使用、修改和分發。

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 💡 靈感來源

這個專案靈感來自於：
- 色彩心理學與音樂治療的結合
- 數位藝術與科技創新的探索
- 跨感官體驗設計的實驗

## 📞 聯絡資訊

如有任何問題或建議，歡迎聯絡：
- 建立 GitHub Issue
- 發送 Pull Request
- 社群討論

---

**讓色彩唱歌，讓圖片發聲！** 🎶