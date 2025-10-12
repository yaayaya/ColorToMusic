/**
 * ColorToMusic - 圖片轉音樂核心程式碼
 * 實現 RGB 像素讀取、亮度/鮮豔度計算、音頻產生等功能
 */

class ColorToMusic {
    constructor() {
        this.audioContext = null;
        this.currentSource = null;
        this.audioBuffer = null;
        this.isPlaying = false;
        this.currentNotes = [];
        this.imageData = null;
        this.sampleRate = 44100;
        
        this.initAudioContext();
    }

    /**
     * 初始化 Web Audio Context
     */
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('無法初始化音頻上下文:', error);
        }
    }

    /**
     * 從圖片檔案載入並分析像素資料
     * @param {File} imageFile 圖片檔案
     * @returns {Promise<ImageData>} 像素資料
     */
    async loadImage(imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                this.imageData = imageData;
                resolve(imageData);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(imageFile);
        });
    }

    /**
     * 計算 RGB 像素的感知亮度
     * 使用標準感知亮度公式：Y = 0.2126R + 0.7152G + 0.0722B
     * @param {number} r 紅色值 (0-255)
     * @param {number} g 綠色值 (0-255)  
     * @param {number} b 藍色值 (0-255)
     * @returns {number} 亮度值 (0-255)
     */
    calculateBrightness(r, g, b) {
        return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }

    /**
     * 計算 RGB 像素的鮮豔度
     * 使用色彩距離公式：sqrt((R-G)² + (G-B)² + (B-R)²)
     * @param {number} r 紅色值 (0-255)
     * @param {number} g 綠色值 (0-255)
     * @param {number} b 藍色值 (0-255)
     * @returns {number} 鮮豔度值 (0-約441)
     */
    calculateVividness(r, g, b) {
        const dr = r - g;
        const dg = g - b;
        const db = b - r;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * 從圖片中按指定順序提取像素並計算數值
     * @param {ImageData} imageData 圖片像素資料
     * @param {Object} options 設定選項
     * @returns {Array} 像素數值陣列
     */
    extractPixelValues(imageData, options = {}) {
        const {
            scanDirection = 'left-right',
            mappingMethod = 'brightness',
            pixelSkip = 1,
            pixelProcessing = 'skip'
        } = options;

        const { data, width, height } = imageData;
        const pixels = [];
        let pixelCount = 0;

        // 像素處理函式
        const processPixel = (x, y) => {
            if (pixelProcessing === 'all') {
                // 全部處理模式
                const index = (y * width + x) * 4;
                return this.getSinglePixelValue(data, index, mappingMethod);
            } else if (pixelProcessing === 'average') {
                // 平均模式：計算區域平均值
                return this.getAveragePixelValue(data, width, height, x, y, pixelSkip, mappingMethod);
            } else {
                // 跳躍模式：只取單一像素
                if (pixelCount % pixelSkip !== 0) {
                    pixelCount++;
                    return null;
                }
                const index = (y * width + x) * 4;
                return this.getSinglePixelValue(data, index, mappingMethod);
            }
        };

        // 根據掃描方向進行掃描
        switch (scanDirection) {
            case 'left-right':
                for (let y = 0; y < height; y += (pixelProcessing === 'all' ? 1 : pixelSkip)) {
                    for (let x = 0; x < width; x += (pixelProcessing === 'all' ? 1 : pixelSkip)) {
                        const pixelData = processPixel(x, y);
                        if (pixelData) {
                            pixels.push({
                                ...pixelData,
                                x, y,
                                position: pixels.length
                            });
                        }
                        pixelCount++;
                    }
                }
                break;

            case 'top-down':
                for (let x = 0; x < width; x += (pixelProcessing === 'all' ? 1 : pixelSkip)) {
                    for (let y = 0; y < height; y += (pixelProcessing === 'all' ? 1 : pixelSkip)) {
                        const pixelData = processPixel(x, y);
                        if (pixelData) {
                            pixels.push({
                                ...pixelData,
                                x, y,
                                position: pixels.length
                            });
                        }
                        pixelCount++;
                    }
                }
                break;

            case 'diagonal':
                const step = pixelProcessing === 'all' ? 1 : pixelSkip;
                const maxDiagonal = Math.ceil((width + height - 1) / step);
                for (let d = 0; d < maxDiagonal; d++) {
                    for (let x = 0; x < width; x += step) {
                        const y = d * step - x;
                        if (y >= 0 && y < height) {
                            const pixelData = processPixel(x, y);
                            if (pixelData) {
                                pixels.push({
                                    ...pixelData,
                                    x, y,
                                    position: pixels.length
                                });
                            }
                            pixelCount++;
                        }
                    }
                }
                break;

            default:
                throw new Error(`不支援的掃描方向: ${scanDirection}`);
        }

        return pixels;
    }

    /**
     * 獲取單一像素值
     */
    getSinglePixelValue(data, index, mappingMethod) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        if (a === 0) return null; // 跳過透明像素
        
        let value;
        if (mappingMethod === 'brightness') {
            value = this.calculateBrightness(r, g, b);
        } else {
            value = this.calculateVividness(r, g, b);
        }
        
        return { r, g, b, a, value };
    }

    /**
     * 獲取區域平均像素值
     */
    getAveragePixelValue(data, width, height, centerX, centerY, regionSize, mappingMethod) {
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let validPixels = 0;
        
        // 計算區域邊界
        const halfSize = Math.floor(regionSize / 2);
        const startX = Math.max(0, centerX - halfSize);
        const endX = Math.min(width - 1, centerX + halfSize);
        const startY = Math.max(0, centerY - halfSize);
        const endY = Math.min(height - 1, centerY + halfSize);
        
        // 計算區域內所有像素的平均值
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const index = (y * width + x) * 4;
                const a = data[index + 3];
                
                if (a > 0) { // 只計算非透明像素
                    totalR += data[index];
                    totalG += data[index + 1];
                    totalB += data[index + 2];
                    totalA += a;
                    validPixels++;
                }
            }
        }
        
        if (validPixels === 0) return null;
        
        // 計算平均值
        const avgR = Math.round(totalR / validPixels);
        const avgG = Math.round(totalG / validPixels);
        const avgB = Math.round(totalB / validPixels);
        const avgA = Math.round(totalA / validPixels);
        
        let value;
        if (mappingMethod === 'brightness') {
            value = this.calculateBrightness(avgR, avgG, avgB);
        } else {
            value = this.calculateVividness(avgR, avgG, avgB);
        }
        
        return { 
            r: avgR, 
            g: avgG, 
            b: avgB, 
            a: avgA, 
            value,
            regionSize: validPixels // 記錄參與平均的像素數
        };
    }

    /**
     * 對音符進行分組以減少急促感
     * @param {Array} pixels 像素陣列
     * @param {string} groupingMethod 分組方法
     * @param {Array} values 數值陣列
     * @param {number} minValue 最小值
     * @param {number} maxValue 最大值
     * @returns {Array} 分組後的像素陣列
     */
    groupNotes(pixels, groupingMethod, values, minValue, maxValue) {
        if (groupingMethod === 'none') {
            return pixels;
        }
        
        const groupedPixels = [];
        
        if (groupingMethod === 'simple') {
            // 簡單分組：每兩個相鄰像素取平均
            for (let i = 0; i < pixels.length; i += 2) {
                if (i + 1 < pixels.length) {
                    const pixel1 = pixels[i];
                    const pixel2 = pixels[i + 1];
                    const avgValue = (pixel1.value + pixel2.value) / 2;
                    
                    groupedPixels.push({
                        x: pixel1.x,
                        y: pixel1.y,
                        r: Math.floor((pixel1.r + pixel2.r) / 2),
                        g: Math.floor((pixel1.g + pixel2.g) / 2),
                        b: Math.floor((pixel1.b + pixel2.b) / 2),
                        a: Math.max(pixel1.a, pixel2.a),
                        value: avgValue,
                        position: pixel1.position
                    });
                } else {
                    groupedPixels.push(pixels[i]);
                }
            }
        } else if (groupingMethod === 'advanced') {
            // 智慧分組：合併相似數值的像素
            const threshold = (maxValue - minValue) * 0.1; // 10% 閾值
            let currentGroup = [pixels[0]];
            
            for (let i = 1; i < pixels.length; i++) {
                const currentPixel = pixels[i];
                const lastInGroup = currentGroup[currentGroup.length - 1];
                
                // 如果數值相似，加入當前組
                if (Math.abs(currentPixel.value - lastInGroup.value) <= threshold) {
                    currentGroup.push(currentPixel);
                } else {
                    // 處理當前組並開始新組
                    if (currentGroup.length > 0) {
                        groupedPixels.push(this.mergePixelGroup(currentGroup));
                    }
                    currentGroup = [currentPixel];
                }
            }
            
            // 處理最後一組
            if (currentGroup.length > 0) {
                groupedPixels.push(this.mergePixelGroup(currentGroup));
            }
        }
        
        return groupedPixels;
    }

    /**
     * 合併像素組為單一像素
     * @param {Array} group 像素組
     * @returns {Object} 合併後的像素
     */
    mergePixelGroup(group) {
        if (group.length === 1) {
            return group[0];
        }
        
        let r = 0, g = 0, b = 0, a = 0, value = 0;
        
        for (const pixel of group) {
            r += pixel.r;
            g += pixel.g;
            b += pixel.b;
            a = Math.max(a, pixel.a);
            value += pixel.value;
        }
        
        const count = group.length;
        
        return {
            x: group[0].x,
            y: group[0].y,
            r: Math.floor(r / count),
            g: Math.floor(g / count),
            b: Math.floor(b / count),
            a: a,
            value: value / count,
            position: group[0].position,
            groupSize: count
        };
    }

    /**
     * 應用音高限制
     * @param {number} frequency 原始頻率
     * @param {Object} pitchLimit 音高限制設定
     * @returns {number} 限制後的頻率
     */
    applyPitchLimit(frequency, pitchLimit) {
        if (!pitchLimit.enabled || pitchLimit.type === 'none') {
            return frequency;
        }
        
        const { min, max } = pitchLimit;
        
        if (frequency < min) {
            // 低於最小音高，映射到最低八度
            return this.transposeToOctave(frequency, min, max);
        } else if (frequency > max) {
            // 高於最大音高，映射到最高八度
            return this.transposeToOctave(frequency, min, max);
        }
        
        return frequency;
    }

    /**
     * 將頻率轉置到指定八度範圍內
     * @param {number} frequency 原始頻率
     * @param {number} minFreq 最小允許頻率
     * @param {number} maxFreq 最大允許頻率
     * @returns {number} 轉置後的頻率
     */
    transposeToOctave(frequency, minFreq, maxFreq) {
        if (frequency >= minFreq && frequency <= maxFreq) {
            return frequency;
        }
        
        // 計算八度比例（每八度頻率翻倍）
        let adjustedFreq = frequency;
        
        if (frequency < minFreq) {
            // 頻率太低，提高八度
            while (adjustedFreq < minFreq) {
                adjustedFreq *= 2;
            }
            // 如果提高後超過最大值，降低到範圍內
            while (adjustedFreq > maxFreq) {
                adjustedFreq /= 2;
            }
        } else if (frequency > maxFreq) {
            // 頻率太高，降低八度
            while (adjustedFreq > maxFreq) {
                adjustedFreq /= 2;
            }
            // 如果降低後低於最小值，提高到範圍內
            while (adjustedFreq < minFreq) {
                adjustedFreq *= 2;
            }
        }
        
        return adjustedFreq;
    }

    /**
     * 將數值映射到音頻頻率
     * @param {number} value 像素數值
     * @param {number} minValue 最小數值
     * @param {number} maxValue 最大數值
     * @param {number} minFreq 最低頻率 (Hz)
     * @param {number} maxFreq 最高頻率 (Hz)
     * @returns {number} 對應的頻率
     */
    mapValueToFrequency(value, minValue, maxValue, minFreq, maxFreq) {
        if (maxValue === minValue) return minFreq;
        
        // 線性映射
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        return minFreq + normalizedValue * (maxFreq - minFreq);
    }

    /**
     * 產生正弦波音頻資料（支援連貫性）
     * @param {number} frequency 起始頻率 (Hz)
     * @param {number} endFrequency 結束頻率 (Hz，用於滑音)
     * @param {number} duration 持續時間 (秒)
     * @param {number} volume 音量 (0-1)
     * @param {string} connectionType 連接類型
     * @returns {Float32Array} 音頻樣本資料
     */
    generateSineWave(frequency, duration, volume = 0.3, endFrequency = null, connectionType = 'discrete') {
        const sampleCount = Math.floor(this.sampleRate * duration);
        const samples = new Float32Array(sampleCount);
        
        for (let i = 0; i < sampleCount; i++) {
            const time = i / this.sampleRate;
            let currentFrequency = frequency;
            
            // 根據連接類型決定頻率變化
            if (connectionType === 'glissando' && endFrequency && endFrequency !== frequency) {
                // 滑音：頻率線性變化
                const progress = time / duration;
                currentFrequency = frequency + (endFrequency - frequency) * progress;
            }
            
            // 淡入淡出效果
            let fadeIn = Math.min(1, time * 20); // 更快的淡入
            let fadeOut = Math.min(1, (duration - time) * 20); // 更快的淡出
            
            // 連奏模式：減少淡入淡出，讓音符更連貫
            if (connectionType === 'legato') {
                fadeIn = Math.min(1, time * 50); // 很快的淡入
                fadeOut = Math.min(1, (duration - time) * 5); // 很慢的淡出，讓音符重疊
            }
            
            const envelope = Math.min(fadeIn, fadeOut);
            
            samples[i] = Math.sin(2 * Math.PI * currentFrequency * time) * volume * envelope;
        }
        
        return samples;
    }

    /**
     * 將像素陣列轉換為音樂
     * @param {File} imageFile 圖片檔案
     * @param {Object} options 轉換設定
     * @returns {Promise<Object>} 音樂資料
     */
    async imageToSound(imageFile, options = {}) {
        const {
            scanDirection = 'left-right',
            freqRange = [220, 1760],
            mappingMethod = 'brightness',
            duration = 10,
            pixelSkip = 1,
            pixelProcessing = 'skip',
            noteLength = 0.2,
            restRatio = 10,
            noteGrouping = 'none',
            noteConnection = 'discrete',
            pitchLimit = { enabled: false, type: 'none', min: 130, max: 1047 }
        } = options;

        try {
            // 載入圖片
            const imageData = await this.loadImage(imageFile);
            
            // 對於大圖片，採用更合理的跳躍策略
            const totalPixels = imageData.width * imageData.height;
            let adjustedPixelSkip = pixelSkip;
            let skipReason = '';
            
            if (totalPixels > 1000000) {
                // 超過 1M 像素 (1000x1000)，限制在 100k 處理
                adjustedPixelSkip = Math.max(pixelSkip, Math.ceil(totalPixels / 100000));
                skipReason = `超大圖片 (${totalPixels.toLocaleString()} 像素)，調整跳躍為 ${adjustedPixelSkip}`;
            } else if (totalPixels > 500000) {
                // 500k-1M 像素，限制在 125k 處理
                adjustedPixelSkip = Math.max(pixelSkip, Math.ceil(totalPixels / 125000));
                skipReason = `大圖片 (${totalPixels.toLocaleString()} 像素)，調整跳躍為 ${adjustedPixelSkip}`;
            } else if (totalPixels > 250000) {
                // 250k-500k 像素，限制在 100k 處理
                adjustedPixelSkip = Math.max(pixelSkip, Math.ceil(totalPixels / 100000));
                skipReason = `中大圖片 (${totalPixels.toLocaleString()} 像素)，調整跳躍為 ${adjustedPixelSkip}`;
            } else if (totalPixels > 100000) {
                // 100k-250k 像素，限制在 80k 處理
                adjustedPixelSkip = Math.max(pixelSkip, Math.ceil(totalPixels / 80000));
                skipReason = `中等圖片 (${totalPixels.toLocaleString()} 像素)，輕微調整跳躍為 ${adjustedPixelSkip}`;
            } else {
                skipReason = `小圖片 (${totalPixels.toLocaleString()} 像素)，維持原始設定 ${pixelSkip}`;
            }
            
            if (adjustedPixelSkip !== pixelSkip) {
                console.log(skipReason);
            }
            
            // 提取像素數值
            const pixels = this.extractPixelValues(imageData, {
                scanDirection,
                mappingMethod,
                pixelSkip: adjustedPixelSkip,
                pixelProcessing
            });

            if (pixels.length === 0) {
                throw new Error('沒有找到有效的像素資料');
            }

            // 計算數值範圍 - 避免使用擴展運算符造成堆疊溢出
            const values = pixels.map(p => p.value);
            let minValue = values[0];
            let maxValue = values[0];
            
            for (let i = 1; i < values.length; i++) {
                if (values[i] < minValue) minValue = values[i];
                if (values[i] > maxValue) maxValue = values[i];
            }

            // 應用音符分組策略
            const groupedPixels = this.groupNotes(pixels, noteGrouping, values, minValue, maxValue);

            // 計算每個音符的實際長度（包含休止符）
            const restLength = noteLength * (restRatio / 100);
            const effectiveNoteLength = noteLength + restLength;
            const totalNotes = Math.min(groupedPixels.length, Math.floor(duration / effectiveNoteLength));
            const actualNoteDuration = duration / totalNotes;

            // 產生音符資料
            const notes = [];
            for (let i = 0; i < totalNotes; i++) {
                const pixel = groupedPixels[Math.floor(i * groupedPixels.length / totalNotes)];
                let frequency = this.mapValueToFrequency(
                    pixel.value, 
                    minValue, 
                    maxValue, 
                    freqRange[0], 
                    freqRange[1]
                );
                
                // 應用音高限制
                if (pitchLimit.enabled) {
                    frequency = this.applyPitchLimit(frequency, pitchLimit);
                }
                
                const startTime = i * effectiveNoteLength;
                
                notes.push({
                    frequency,
                    originalFrequency: this.mapValueToFrequency(pixel.value, minValue, maxValue, freqRange[0], freqRange[1]),
                    startTime: startTime,
                    duration: noteLength, // 實際音符長度，不包含休止符
                    pixel: pixel,
                    hasRest: restRatio > 0,
                    connection: noteConnection,
                    pitchLimited: pitchLimit.enabled && frequency !== this.mapValueToFrequency(pixel.value, minValue, maxValue, freqRange[0], freqRange[1])
                });
            }

            // 產生音頻緩衝區
            const audioBuffer = await this.generateAudioBuffer(notes, duration);
            
            this.currentNotes = notes;
            this.audioBuffer = audioBuffer;

            return {
                notes,
                audioBuffer,
                imageData,
                totalPixels: pixels.length,
                valueRange: [minValue, maxValue],
                freqRange
            };

        } catch (error) {
            console.error('圖片轉音樂失敗:', error);
            throw error;
        }
    }

    /**
     * 產生完整的音頻緩衝區
     * @param {Array} notes 音符陣列
     * @param {number} totalDuration 總時長
     * @returns {Promise<AudioBuffer>} 音頻緩衝區
     */
    async generateAudioBuffer(notes, totalDuration) {
        const sampleCount = Math.floor(this.sampleRate * totalDuration);
        const audioBuffer = this.audioContext.createBuffer(1, sampleCount, this.sampleRate);
        const channelData = audioBuffer.getChannelData(0);

        // 為每個音符產生波形並混合
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const nextNote = i < notes.length - 1 ? notes[i + 1] : null;
            const startSample = Math.floor(note.startTime * this.sampleRate);
            
            let noteSamples;
            
            // 根據連接類型產生不同的波形
            if (note.connection === 'glissando' && nextNote) {
                // 滑音：從當前頻率滑到下一個頻率
                noteSamples = this.generateSineWave(
                    note.frequency, 
                    note.duration, 
                    0.15, 
                    nextNote.frequency, 
                    'glissando'
                );
            } else if (note.connection === 'legato') {
                // 連奏：延長音符並與下一個音符重疊
                const extendedDuration = note.duration * 1.2; // 延長20%
                noteSamples = this.generateSineWave(
                    note.frequency, 
                    extendedDuration, 
                    0.15, 
                    null, 
                    'legato'
                );
            } else {
                // 離散：標準音符
                noteSamples = this.generateSineWave(
                    note.frequency, 
                    note.duration, 
                    0.15, 
                    null, 
                    'discrete'
                );
            }
            
            // 將音符混合到主緩衝區
            for (let j = 0; j < noteSamples.length && startSample + j < sampleCount; j++) {
                channelData[startSample + j] += noteSamples[j];
            }
        }

        // 正規化音量，避免削波
        this.normalizeAudioBuffer(channelData);

        return audioBuffer;
    }

    /**
     * 正規化音頻緩衝區，防止音量過大
     * @param {Float32Array} channelData 音頻資料
     */
    normalizeAudioBuffer(channelData) {
        let maxAmplitude = 0;
        for (let i = 0; i < channelData.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
        }
        
        if (maxAmplitude > 0.8) {
            const scale = 0.8 / maxAmplitude;
            for (let i = 0; i < channelData.length; i++) {
                channelData[i] *= scale;
            }
        }
    }

    /**
     * 播放產生的音樂
     * @param {Function} onProgress 進度回調函式
     * @returns {Promise<void>}
     */
    async playAudio(onProgress = null) {
        if (!this.audioBuffer) {
            throw new Error('沒有音頻資料可播放');
        }

        // 停止現有播放
        this.stopAudio();

        // 確保音頻上下文已啟動
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // 建立音源
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.audioBuffer;
        this.currentSource.connect(this.audioContext.destination);

        // 設定播放結束回調
        this.currentSource.onended = () => {
            this.isPlaying = false;
            if (onProgress) onProgress(1.0, true);
        };

        // 開始播放
        this.currentSource.start();
        this.isPlaying = true;

        // 進度追蹤
        if (onProgress) {
            const duration = this.audioBuffer.duration;
            const startTime = this.audioContext.currentTime;
            
            const updateProgress = () => {
                if (this.isPlaying) {
                    const elapsed = this.audioContext.currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1.0);
                    onProgress(progress, false);
                    
                    if (progress < 1.0) {
                        requestAnimationFrame(updateProgress);
                    }
                }
            };
            
            requestAnimationFrame(updateProgress);
        }
    }

    /**
     * 停止播放音樂
     */
    stopAudio() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (error) {
                // 忽略已停止的錯誤
            }
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    /**
     * 將音頻緩衝區匯出為 WAV 檔案
     * @param {string} filename 檔案名稱
     * @returns {Promise<void>}
     */
    async exportToWAV(filename = 'color-music.wav') {
        if (!this.audioBuffer) {
            throw new Error('沒有音頻資料可匯出');
        }

        const wav = this.audioBufferToWav(this.audioBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        
        // 建立下載連結
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 將 AudioBuffer 轉換為 WAV 格式的 ArrayBuffer
     * @param {AudioBuffer} audioBuffer 音頻緩衝區
     * @returns {ArrayBuffer} WAV 格式資料
     */
    audioBufferToWav(audioBuffer) {
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        // WAV 檔頭
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // 轉換浮點數為 16位元整數
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return arrayBuffer;
    }

    /**
     * 繪製波形到 Canvas
     * @param {HTMLCanvasElement} canvas 畫布元素
     * @param {number} progress 播放進度 (0-1)
     */
    drawWaveform(canvas, progress = 0) {
        if (!this.audioBuffer) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const channelData = this.audioBuffer.getChannelData(0);
        const samples = channelData.length;
        const samplesPerPixel = Math.floor(samples / width);

        // 清空畫布
        ctx.fillStyle = '#f0f4ff';
        ctx.fillRect(0, 0, width, height);

        // 繪製波形
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const centerY = height / 2;
        
        for (let x = 0; x < width; x++) {
            const sampleIndex = x * samplesPerPixel;
            let min = 1, max = -1;
            
            // 找出該像素範圍內的最大最小值
            for (let i = 0; i < samplesPerPixel && sampleIndex + i < samples; i++) {
                const sample = channelData[sampleIndex + i];
                min = Math.min(min, sample);
                max = Math.max(max, sample);
            }
            
            const y1 = centerY + min * centerY;
            const y2 = centerY + max * centerY;
            
            if (x === 0) {
                ctx.moveTo(x, y1);
            } else {
                ctx.lineTo(x, y1);
            }
        }
        
        ctx.stroke();

        // 繪製進度線
        if (progress > 0) {
            const progressX = width * progress;
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(progressX, 0);
            ctx.lineTo(progressX, height);
            ctx.stroke();
        }
    }

    /**
     * 產生映射預覽圖片
     * @param {ImageData} imageData 原始圖片資料
     * @param {string} mappingMethod 映射方式
     * @param {HTMLCanvasElement} originalCanvas 原圖畫布
     * @param {HTMLCanvasElement} mappedCanvas 映射圖畫布
     * @returns {Object} 映射統計資訊
     */
    generateMappingPreview(imageData, mappingMethod, originalCanvas, mappedCanvas) {
        const { data, width, height } = imageData;
        
        // 設定畫布尺寸
        const canvasSize = 200;
        const scaleX = canvasSize / width;
        const scaleY = canvasSize / height;
        const scale = Math.min(scaleX, scaleY);
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(height * scale);
        
        // 原圖預覽
        const originalCtx = originalCanvas.getContext('2d');
        originalCtx.clearRect(0, 0, canvasSize, canvasSize);
        
        // 建立臨時畫布來縮放原圖
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        
        // 將原圖縮放並置中顯示
        const offsetX = (canvasSize - scaledWidth) / 2;
        const offsetY = (canvasSize - scaledHeight) / 2;
        originalCtx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // 映射圖預覽
        const mappedCtx = mappedCanvas.getContext('2d');
        mappedCtx.clearRect(0, 0, canvasSize, canvasSize);
        
        // 計算所有像素的映射值 - 限制處理的像素數量以避免效能問題
        const values = [];
        const maxSamples = 10000; // 最多採樣 10000 個像素
        const sampleStep = Math.max(1, Math.floor(data.length / (4 * maxSamples)));
        
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) { // 跳過透明像素
                let value;
                if (mappingMethod === 'brightness') {
                    value = this.calculateBrightness(r, g, b);
                } else {
                    value = this.calculateVividness(r, g, b);
                }
                values.push(value);
            }
        }
        
        if (values.length === 0) {
            return {
                minValue: '0',
                maxValue: '0',
                range: '0',
                totalPixels: 0
            };
        }
        
        // 計算數值範圍 - 避免使用擴展運算符造成堆疊溢出
        let minValue = values[0];
        let maxValue = values[0];
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] < minValue) minValue = values[i];
            if (values[i] > maxValue) maxValue = values[i];
        }
        
        const valueRange = maxValue - minValue;
        
        // 產生映射圖像
        const mappedImageData = mappedCtx.createImageData(scaledWidth, scaledHeight);
        const mappedData = mappedImageData.data;
        
        for (let y = 0; y < scaledHeight; y++) {
            for (let x = 0; x < scaledWidth; x++) {
                // 從縮放座標映射回原始座標
                const origX = Math.floor(x / scale);
                const origY = Math.floor(y / scale);
                
                if (origX < width && origY < height) {
                    const origIndex = (origY * width + origX) * 4;
                    const r = data[origIndex];
                    const g = data[origIndex + 1];
                    const b = data[origIndex + 2];
                    const a = data[origIndex + 3];
                    
                    let value;
                    if (mappingMethod === 'brightness') {
                        value = this.calculateBrightness(r, g, b);
                    } else {
                        value = this.calculateVividness(r, g, b);
                    }
                    
                    // 正規化到 0-255 範圍
                    const normalizedValue = valueRange > 0 ? 
                        Math.floor((value - minValue) / valueRange * 255) : 0;
                    
                    const mappedIndex = (y * scaledWidth + x) * 4;
                    
                    if (mappingMethod === 'brightness') {
                        // 亮度模式：顯示為灰階
                        mappedData[mappedIndex] = normalizedValue;     // R
                        mappedData[mappedIndex + 1] = normalizedValue; // G
                        mappedData[mappedIndex + 2] = normalizedValue; // B
                    } else {
                        // 鮮豔度模式：使用色彩映射（藍→紅漸變）
                        const ratio = normalizedValue / 255;
                        mappedData[mappedIndex] = Math.floor(255 * ratio);           // R (高鮮豔度為紅)
                        mappedData[mappedIndex + 1] = Math.floor(255 * (1 - ratio)); // G 
                        mappedData[mappedIndex + 2] = Math.floor(255 * (1 - ratio)); // B (低鮮豔度為藍)
                    }
                    mappedData[mappedIndex + 3] = a; // A
                }
            }
        }
        
        // 將映射圖像繪製到畫布
        mappedCtx.putImageData(mappedImageData, offsetX, offsetY);
        
        return {
            minValue: minValue.toFixed(1),
            maxValue: maxValue.toFixed(1),
            range: valueRange.toFixed(1),
            totalPixels: values.length
        };
    }

    /**
     * 獲取專案資訊
     * @returns {Object} 專案統計資訊
     */
    getInfo() {
        if (!this.imageData) return null;

        return {
            imageSize: `${this.imageData.width} x ${this.imageData.height}`,
            totalPixels: this.imageData.width * this.imageData.height,
            notesCount: this.currentNotes ? this.currentNotes.length : 0,
            duration: this.audioBuffer ? this.audioBuffer.duration.toFixed(2) : 0
        };
    }
}