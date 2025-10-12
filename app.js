/**
 * 主要應用程式邏輯 - 處理 GUI 互動和事件
 */

// 全域變數
let colorToMusic = null;
let currentImageFile = null;
let isGenerating = false;

// DOM 元素
const elements = {
    uploadArea: null,
    imageInput: null,
    imagePreview: null,
    previewImg: null,
    scanDirection: null,
    mappingMethod: null,
    minFreq: null,
    maxFreq: null,
    minFreqValue: null,
    maxFreqValue: null,
    duration: null,
    pixelSkip: null,
    generateBtn: null,
    playBtn: null,
    stopBtn: null,
    downloadBtn: null,
    waveformCanvas: null,
    progress: null,
    imageSize: null,
    totalPixels: null,
    estimatedNotes: null,
    visualizationSection: null,
    originalCanvas: null,
    mappedCanvas: null,
    mappingLabel: null,
    valueRangeDisplay: null,
    noteLength: null,
    noteLengthValue: null,
    restRatio: null,
    restRatioValue: null,
    noteGrouping: null,
    scanDirectionDesc: null,
    noteConnection: null,
    connectionDesc: null,
    pixelProcessing: null,
    pixelProcessingDesc: null,
    enablePitchLimit: null,
    minPitch: null,
    maxPitch: null,
    minPitchValue: null,
    maxPitchValue: null,
    pitchLimitDesc: null
};

/**
 * 初始化應用程式
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化 ColorToMusic 實例
        colorToMusic = new ColorToMusic();
        
        // 獲取 DOM 元素
        initializeElements();
        
        // 設定事件監聽器
        setupEventListeners();
        
        // 初始化 UI 狀態
        updateUI();
        
        console.log('ColorToMusic 應用程式初始化完成');
    } catch (error) {
        console.error('應用程式初始化失敗:', error);
        showMessage('應用程式初始化失敗，請重新整理頁面', 'error');
    }
});

/**
 * 初始化 DOM 元素參考
 */
function initializeElements() {
    elements.uploadArea = document.getElementById('uploadArea');
    elements.imageInput = document.getElementById('imageInput');
    elements.imagePreview = document.getElementById('imagePreview');
    elements.previewImg = document.getElementById('previewImg');
    elements.scanDirection = document.getElementById('scanDirection');
    elements.mappingMethod = document.getElementById('mappingMethod');
    elements.minFreq = document.getElementById('minFreq');
    elements.maxFreq = document.getElementById('maxFreq');
    elements.minFreqValue = document.getElementById('minFreqValue');
    elements.maxFreqValue = document.getElementById('maxFreqValue');
    elements.duration = document.getElementById('duration');
    elements.pixelSkip = document.getElementById('pixelSkip');
    elements.generateBtn = document.getElementById('generateBtn');
    elements.playBtn = document.getElementById('playBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.waveformCanvas = document.getElementById('waveformCanvas');
    elements.progress = document.getElementById('progress');
    elements.imageSize = document.getElementById('imageSize');
    elements.totalPixels = document.getElementById('totalPixels');
    elements.estimatedNotes = document.getElementById('estimatedNotes');
    elements.visualizationSection = document.querySelector('.visualization-section');
    elements.originalCanvas = document.getElementById('originalCanvas');
    elements.mappedCanvas = document.getElementById('mappedCanvas');
    elements.mappingLabel = document.getElementById('mappingLabel');
    elements.valueRangeDisplay = document.getElementById('valueRangeDisplay');
    elements.noteLength = document.getElementById('noteLength');
    elements.noteLengthValue = document.getElementById('noteLengthValue');
    elements.restRatio = document.getElementById('restRatio');
    elements.restRatioValue = document.getElementById('restRatioValue');
    elements.noteGrouping = document.getElementById('noteGrouping');
    elements.scanDirectionDesc = document.getElementById('scanDirectionDesc');
    elements.noteConnection = document.getElementById('noteConnection');
    elements.connectionDesc = document.getElementById('connectionDesc');
    elements.pixelProcessing = document.getElementById('pixelProcessing');
    elements.pixelProcessingDesc = document.getElementById('pixelProcessingDesc');
    elements.enablePitchLimit = document.getElementById('enablePitchLimit');
    elements.minPitch = document.getElementById('minPitch');
    elements.maxPitch = document.getElementById('maxPitch');
    elements.minPitchValue = document.getElementById('minPitchValue');
    elements.maxPitchValue = document.getElementById('maxPitchValue');
    elements.pitchLimitDesc = document.getElementById('pitchLimitDesc');
}

/**
 * 設定所有事件監聽器
 */
function setupEventListeners() {
    // 圖片上傳相關事件
    elements.uploadArea.addEventListener('click', () => elements.imageInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.imageInput.addEventListener('change', handleImageSelect);

    // 頻率滑桿事件
    elements.minFreq.addEventListener('input', updateFrequencyDisplay);
    elements.maxFreq.addEventListener('input', updateFrequencyDisplay);
    elements.noteLength.addEventListener('input', updateRhythmControls);
    elements.restRatio.addEventListener('input', updateRhythmControls);
    elements.minPitch.addEventListener('input', updatePitchLimitDisplay);
    elements.maxPitch.addEventListener('input', updatePitchLimitDisplay);

    // 參數變更事件
    elements.scanDirection.addEventListener('change', updateScanDirectionInfo);
    elements.mappingMethod.addEventListener('change', updateMappingPreview);
    elements.duration.addEventListener('input', updateEstimatedNotes);
    elements.pixelSkip.addEventListener('input', updateEstimatedNotes);
    elements.noteGrouping.addEventListener('change', updateEstimatedNotes);
    elements.noteConnection.addEventListener('change', updateConnectionInfo);
    elements.pixelProcessing.addEventListener('change', updatePixelProcessingInfo);
    elements.enablePitchLimit.addEventListener('change', updatePitchLimitInfo);

    // 按鈕事件
    elements.generateBtn.addEventListener('click', generateMusic);
    elements.playBtn.addEventListener('click', playMusic);
    elements.stopBtn.addEventListener('click', stopMusic);
    elements.downloadBtn.addEventListener('click', downloadMusic);

    // 鍵盤快捷鍵
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * 處理拖曳 hover 事件
 */
function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

/**
 * 處理拖曳離開事件
 */
function handleDragLeave(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

/**
 * 處理檔案拖曳放下事件
 */
function handleDrop(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            handleImageFile(file);
        } else {
            showMessage('請選擇有效的圖片檔案 (JPG, PNG)', 'error');
        }
    }
}

/**
 * 處理圖片選擇事件
 */
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

/**
 * 處理圖片檔案載入
 */
async function handleImageFile(file) {
    try {
        currentImageFile = file;
        
        // 顯示圖片預覽
        const imageUrl = URL.createObjectURL(file);
        elements.previewImg.src = imageUrl;
        elements.imagePreview.style.display = 'block';
        
        // 載入圖片以獲取尺寸資訊
        await colorToMusic.loadImage(file);
        const info = colorToMusic.getInfo();
        
        // 更新 UI 資訊
        elements.imageSize.textContent = info.imageSize;
        elements.totalPixels.textContent = info.totalPixels.toLocaleString();
        
        // 啟用產生按鈕
        elements.generateBtn.disabled = false;
        
        // 更新預估音符數
        updateEstimatedNotes();
        
        // 確保圖片載入完成後再產生映射預覽
        setTimeout(() => {
            updateMappingPreview();
        }, 100);
        
        showMessage('圖片載入成功！', 'success');
        
    } catch (error) {
        console.error('圖片載入失敗:', error);
        showMessage('圖片載入失敗，請重試', 'error');
    }
}

/**
 * 頻率轉音符名稱
 */
function frequencyToNoteName(frequency) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    if (frequency <= 0) return 'N/A';
    
    const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(halfStepsBelowMiddleC / 12);
    const noteIndex = halfStepsBelowMiddleC % 12;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${noteNames[noteIndex]}${octave}`;
}

/**
 * 更新音高限制資訊
 */
function updatePitchLimitInfo() {
    const pitchLimitType = elements.enablePitchLimit.value;
    const pitchLimitGroup = document.getElementById('pitchLimitGroup');
    
    if (pitchLimitType === 'none') {
        pitchLimitGroup.style.display = 'none';
        elements.pitchLimitDesc.textContent = '無限制：使用完整的頻率範圍進行映射';
    } else if (pitchLimitType === 'musical') {
        pitchLimitGroup.style.display = 'block';
        // 設定音樂限制的預設值
        elements.minPitch.value = 130; // C3
        elements.maxPitch.value = 1047; // C6
        updatePitchLimitDisplay();
        elements.pitchLimitDesc.textContent = '音樂限制：限制在舒適的聽覺範圍內，適合大多數音樂';
    } else if (pitchLimitType === 'custom') {
        pitchLimitGroup.style.display = 'block';
        updatePitchLimitDisplay();
        elements.pitchLimitDesc.textContent = '自訂限制：手動設定音高範圍，超出範圍的音符會被調整';
    }
}

/**
 * 更新音高限制顯示
 */
function updatePitchLimitDisplay() {
    const minPitch = parseInt(elements.minPitch.value);
    const maxPitch = parseInt(elements.maxPitch.value);
    
    // 確保最小音高不超過最大音高
    if (minPitch >= maxPitch) {
        elements.minPitch.value = maxPitch - 50;
    }
    
    const minNoteName = frequencyToNoteName(parseInt(elements.minPitch.value));
    const maxNoteName = frequencyToNoteName(parseInt(elements.maxPitch.value));
    
    elements.minPitchValue.textContent = `${elements.minPitch.value} Hz (${minNoteName})`;
    elements.maxPitchValue.textContent = `${elements.maxPitch.value} Hz (${maxNoteName})`;
}

/**
 * 更新像素處理方式說明
 */
function updatePixelProcessingInfo() {
    const pixelProcessing = elements.pixelProcessing.value;
    const pixelSkip = parseInt(elements.pixelSkip.value);
    
    const descriptions = {
        'skip': `跳躍模式：每 ${pixelSkip} 個像素取 1 個，快速但可能丟失細節`,
        'average': `平均模式：每 ${pixelSkip} 個像素計算平均值，保留更多資訊同時提升效率`,
        'all': '完整模式：處理所有像素，最高品質但可能很慢（建議小圖片使用）'
    };
    
    elements.pixelProcessingDesc.textContent = descriptions[pixelProcessing];
    
    // 根據處理方式調整控制項
    if (pixelProcessing === 'all') {
        elements.pixelSkip.disabled = true;
        elements.pixelSkip.value = 1;
    } else {
        elements.pixelSkip.disabled = false;
    }
    
    updateEstimatedNotes();
}

/**
 * 更新連貫性說明
 */
function updateConnectionInfo() {
    const noteConnection = elements.noteConnection.value;
    const descriptions = {
        'discrete': '離散音符：每個音符獨立，適合節奏感強的圖片，清晰的音符分界',
        'legato': '連奏：音符間平滑過渡，適合柔和圖片，減少突兀的音調跳躍',
        'glissando': '滑音：頻率連續滑動，適合漸變圖片，創造流暢的音調變化'
    };
    
    elements.connectionDesc.textContent = descriptions[noteConnection];
}

/**
 * 更新掃描方向說明
 */
function updateScanDirectionInfo() {
    const scanDirection = elements.scanDirection.value;
    const descriptions = {
        'left-right': '橫向掃描：適合風景照，產生流暢的左右音樂變化，如日出日落效果',
        'top-down': '縱向掃描：適合建築物、人像，產生上下音樂變化，如瀑布流水效果',
        'diagonal': '對角線掃描：適合抽象圖案，產生螺旋音樂效果，創造獨特節奏感'
    };
    
    elements.scanDirectionDesc.textContent = descriptions[scanDirection];
    updateEstimatedNotes();
}

/**
 * 更新節奏控制顯示
 */
function updateRhythmControls() {
    const noteLength = parseFloat(elements.noteLength.value);
    const restRatio = parseInt(elements.restRatio.value);
    
    elements.noteLengthValue.textContent = `${noteLength.toFixed(2)} 秒`;
    elements.restRatioValue.textContent = `${restRatio}%`;
    
    updateEstimatedNotes();
}

/**
 * 更新頻率顯示
 */
function updateFrequencyDisplay() {
    const minFreq = parseInt(elements.minFreq.value);
    const maxFreq = parseInt(elements.maxFreq.value);
    
    // 確保最小頻率不超過最大頻率
    if (minFreq >= maxFreq) {
        elements.minFreq.value = maxFreq - 10;
    }
    
    elements.minFreqValue.textContent = `${elements.minFreq.value} Hz`;
    elements.maxFreqValue.textContent = `${elements.maxFreq.value} Hz`;
}

/**
 * 更新映射預覽
 */
function updateMappingPreview() {
    if (!currentImageFile) {
        return;
    }
    
    if (!colorToMusic.imageData) {
        return;
    }
    
    if (!elements.originalCanvas || !elements.mappedCanvas) {
        console.error('找不到預覽畫布元素');
        return;
    }
    
    try {
        const mappingMethod = elements.mappingMethod.value;
        
        // 更新標籤
        elements.mappingLabel.textContent = mappingMethod === 'brightness' ? '亮度映射' : '鮮豔度映射';
        
        // 產生映射預覽
        const stats = colorToMusic.generateMappingPreview(
            colorToMusic.imageData,
            mappingMethod,
            elements.originalCanvas,
            elements.mappedCanvas
        );
        
        // 更新統計資訊
        elements.valueRangeDisplay.textContent = `${stats.minValue} - ${stats.maxValue} (範圍: ${stats.range})`;
        
    } catch (error) {
        console.error('映射預覽失敗:', error);
        showMessage('映射預覽產生失敗：' + error.message, 'error');
    }
}

/**
 * 更新預估音符數
 */
function updateEstimatedNotes() {
    if (!currentImageFile || !colorToMusic.imageData) return;
    
    const info = colorToMusic.getInfo();
    const pixelProcessing = elements.pixelProcessing.value;
    const pixelSkip = parseInt(elements.pixelSkip.value);
    const duration = parseFloat(elements.duration.value);
    const noteLength = parseFloat(elements.noteLength.value);
    const restRatio = parseInt(elements.restRatio.value);
    const noteGrouping = elements.noteGrouping.value;
    
    let totalPixels = info.totalPixels;
    
    // 根據處理方式計算實際處理的像素數
    if (pixelProcessing === 'all') {
        // 全部處理，但有上限保護
        if (totalPixels > 100000) {
            totalPixels = 100000; // 限制最大處理數量
        }
    } else if (pixelProcessing === 'skip') {
        totalPixels = Math.floor(totalPixels / pixelSkip);
    } else if (pixelProcessing === 'average') {
        // 平均模式處理的像素數和跳躍相同，但品質更好
        totalPixels = Math.floor(totalPixels / pixelSkip);
    }
    
    // 考慮音符長度和休止符
    const effectiveNoteLength = noteLength * (1 + restRatio / 100);
    const maxNotes = Math.floor(duration / effectiveNoteLength);
    
    let estimatedNotes = Math.min(totalPixels, maxNotes);
    
    // 考慮音符分組
    if (noteGrouping === 'simple') {
        estimatedNotes = Math.floor(estimatedNotes / 2);
    } else if (noteGrouping === 'advanced') {
        estimatedNotes = Math.floor(estimatedNotes / 3);
    }
    
    elements.estimatedNotes.textContent = estimatedNotes.toLocaleString();
    
    // 警告提示
    if (pixelProcessing === 'all' && info.totalPixels > 50000) {
        elements.estimatedNotes.textContent += ' ⚠️ 大圖片全部處理可能很慢';
    }
}

/**
 * 產生音樂
 */
async function generateMusic() {
    if (!currentImageFile || isGenerating) return;
    
    try {
        isGenerating = true;
        elements.generateBtn.innerHTML = '<span class="loading"></span>產生中...';
        elements.generateBtn.disabled = true;
        
        // 收集參數
        const options = {
            scanDirection: elements.scanDirection.value,
            freqRange: [parseInt(elements.minFreq.value), parseInt(elements.maxFreq.value)],
            mappingMethod: elements.mappingMethod.value,
            duration: parseFloat(elements.duration.value),
            pixelSkip: parseInt(elements.pixelSkip.value),
            pixelProcessing: elements.pixelProcessing.value,
            noteLength: parseFloat(elements.noteLength.value),
            restRatio: parseInt(elements.restRatio.value),
            noteGrouping: elements.noteGrouping.value,
            noteConnection: elements.noteConnection.value,
            pitchLimit: {
                enabled: elements.enablePitchLimit.value !== 'none',
                type: elements.enablePitchLimit.value,
                min: parseInt(elements.minPitch.value),
                max: parseInt(elements.maxPitch.value)
            }
        };
        
        // 產生音樂
        const result = await colorToMusic.imageToSound(currentImageFile, options);
        
        // 顯示視覺化區域
        elements.visualizationSection.style.display = 'block';
        
        // 繪製波形
        colorToMusic.drawWaveform(elements.waveformCanvas);
        
        // 啟用播放和下載按鈕
        elements.playBtn.disabled = false;
        elements.downloadBtn.disabled = false;
        
        // 更新資訊
        const info = colorToMusic.getInfo();
        elements.estimatedNotes.textContent = info.notesCount.toLocaleString();
        
        showMessage(`音樂產生成功！總共 ${info.notesCount} 個音符，時長 ${info.duration} 秒`, 'success');
        
    } catch (error) {
        console.error('音樂產生失敗:', error);
        showMessage('音樂產生失敗：' + error.message, 'error');
    } finally {
        isGenerating = false;
        elements.generateBtn.innerHTML = '🎵 產生音樂';
        elements.generateBtn.disabled = !currentImageFile;
    }
}

/**
 * 播放音樂
 */
async function playMusic() {
    if (!colorToMusic.audioBuffer) return;
    
    try {
        elements.playBtn.disabled = true;
        elements.stopBtn.disabled = false;
        
        await colorToMusic.playAudio((progress, isFinished) => {
            // 更新進度條
            elements.progress.style.width = `${progress * 100}%`;
            
            // 更新波形視覺化
            colorToMusic.drawWaveform(elements.waveformCanvas, progress);
            
            if (isFinished) {
                elements.playBtn.disabled = false;
                elements.stopBtn.disabled = true;
            }
        });
        
    } catch (error) {
        console.error('播放失敗:', error);
        showMessage('播放失敗：' + error.message, 'error');
        elements.playBtn.disabled = false;
        elements.stopBtn.disabled = true;
    }
}

/**
 * 停止播放音樂
 */
function stopMusic() {
    colorToMusic.stopAudio();
    elements.playBtn.disabled = false;
    elements.stopBtn.disabled = true;
    elements.progress.style.width = '0%';
    
    // 重新繪製波形（移除進度線）
    colorToMusic.drawWaveform(elements.waveformCanvas);
}

/**
 * 下載音樂檔案
 */
async function downloadMusic() {
    if (!colorToMusic.audioBuffer) return;
    
    try {
        const filename = `color-music-${new Date().getTime()}.wav`;
        await colorToMusic.exportToWAV(filename);
        showMessage('音檔下載成功！', 'success');
    } catch (error) {
        console.error('下載失敗:', error);
        showMessage('下載失敗：' + error.message, 'error');
    }
}

/**
 * 處理鍵盤快捷鍵
 */
function handleKeyboardShortcuts(event) {
    // Space - 播放/停止
    if (event.code === 'Space' && !event.target.matches('input, select, textarea')) {
        event.preventDefault();
        if (colorToMusic.isPlaying) {
            stopMusic();
        } else if (!elements.playBtn.disabled) {
            playMusic();
        }
    }
    
    // Enter - 產生音樂
    if (event.code === 'Enter' && event.ctrlKey && !elements.generateBtn.disabled) {
        event.preventDefault();
        generateMusic();
    }
}

/**
 * 更新 UI 狀態
 */
function updateUI() {
    updateFrequencyDisplay();
    updateRhythmControls();
    updateScanDirectionInfo();
    updateConnectionInfo();
    updatePixelProcessingInfo();
    updatePitchLimitInfo();
    updateEstimatedNotes();
}

/**
 * 顯示訊息
 */
function showMessage(text, type = 'info') {
    // 移除現有訊息
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // 建立新訊息
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // 插入到主要內容區域的頂部
    const main = document.querySelector('main');
    main.insertBefore(message, main.firstChild);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// 防止頁面重新載入時遺失狀態
window.addEventListener('beforeunload', (event) => {
    if (colorToMusic && colorToMusic.isPlaying) {
        colorToMusic.stopAudio();
    }
});

// 錯誤處理
window.addEventListener('error', (event) => {
    console.error('全域錯誤:', event.error);
    showMessage('發生未預期的錯誤，請重新整理頁面', 'error');
});

// 網路狀態監控
window.addEventListener('online', () => {
    showMessage('網路連線已恢復', 'success');
});

window.addEventListener('offline', () => {
    showMessage('網路連線中斷，某些功能可能無法使用', 'error');
});