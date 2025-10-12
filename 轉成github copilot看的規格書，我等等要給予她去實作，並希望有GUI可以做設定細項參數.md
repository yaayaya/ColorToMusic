
# 轉成github copilot看的規格書，我等等要給予她去實作，並希望有GUI可以做設定細項參數

以下是給 Copilot 看的 function 規格書草稿，包含 GUI 參數細項，可直接套用來開發支援「從圖片左上到右下，依照像素 RGB 轉音高、可自訂掃描參數」的功能。[^1][^2][^3]

***

### 專案目標

- 從圖片每個像素 RGB 計算出數值，映射成聲音頻率(高低音)
- 支援依照圖片像素順序(左上至右下)掃描並合成音樂
- 提供 GUI 讓使用者選擇圖片、調整參數(如頻率範圍、掃描方式等)
- 可播放或匯出生成的音軌(wav/mp3)


### Function 規格 (Copilot 可識別描述)

```ts
/**
 * 主要 API：imageToSound
 * @param image 檔案路徑或二進位資料
 * @param options 用戶自訂的圖像音樂參數
 * @returns 生成音軌，及音符資訊
 */
function imageToSound(
  image: string | ArrayBuffer,
  options?: {
    scanDirection?: 'left-right' | 'top-down' | 'diagonal', // 掃描方式
    freqRange?: [number, number], // 頻率範圍 [低頻,高頻]
    mapping?: 'brightness' | 'vividness', // 音高用亮度/鮮豔度
    duration?: number, // 音樂總秒數
    bpm?: number,      // 每個像素的節拍
    play?: boolean,    // 完成時自動播放
    export?: 'wav' | 'mp3', // 匯出音檔格式
  }
): {
  notes: {freq:number, time:number}[], // 音符資料
  audioBuffer: Float32Array,           // 原始波形資料
  filePath?: string,                   // 若匯出音檔
}

/**
 * GUI 參數設定元件
 * 1. 圖片上傳/選擇
 * 2. 頻率範圍(拖曳選擇) [220Hz ~ 1760Hz]
 * 3. 掃描順序 (左至右 / 上至下 / 對角線)
 * 4. 映射方式 (亮度/鮮豔度)
 * 5. 播放、匯出按鈕
 * 6. 預覽音譜/簡易波形
 */
```


### GUI 功能需求 (摘要)

- 圖片檔案選擇（支援 jpg, png）
- 頻率範圍設定（拖曳兩個滑桿）
- 掃描方向選擇（三種 radio button）
- 映射公式選用（亮度/鮮豔度，dropdown）
- 預設 BPM/音長微調
- 音樂播放/匯出按鈕
- 視覺化音譜預覽（可選波形/鋼琴卷）

***

### 技術備註

- 可用 RGB 亮度公式/euclidean 鮮豔度公式做映射
- 使用 WebAudio 或 wav/mp3 encoder 產生音檔
- GUI 元件可用 Electron/React/Vue 或任何前端框架

**

