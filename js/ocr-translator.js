/**
 * OCR翻译器 - 图片文字识别和翻译功能
 * 支持多种图片格式的文字识别和翻译
 */

class OCRTranslator {
  constructor() {
    this.isProcessing = false;
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.canvas = null;
    this.ctx = null;
    this.processedImages = new Set();
    this.initCanvas();
  }

  /**
     * 初始化Canvas
     */
  initCanvas() {
    try {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    } catch (error) {
      console.error('OCR翻译器: Canvas初始化失败', error);
    }
  }

  /**
     * 检查图片格式是否支持
     * @param {string} src - 图片源地址
     * @returns {boolean}
     */
  isSupportedFormat(src) {
    if (!src || typeof src !== 'string') return false;

    const extension = src.split('.').pop()?.toLowerCase();
    return this.supportedFormats.includes(extension) ||
               src.startsWith('data:image/') ||
               src.startsWith('blob:');
  }

  /**
     * 获取页面中所有图片元素
     * @returns {Array} 图片元素数组
     */
  getPageImages() {
    try {
      const images = [];
      const imgElements = document.querySelectorAll('img');
      const bgImages = this.getBackgroundImages();

      // 收集img标签
      imgElements.forEach(img => {
        if (this.isImageVisible(img) && this.isSupportedFormat(img.src)) {
          images.push({
            element: img,
            src: img.src,
            type: 'img'
          });
        }
      });

      // 收集背景图片
      bgImages.forEach(bgImg => {
        images.push(bgImg);
      });

      return images;
    } catch (error) {
      console.error('OCR翻译器: 获取页面图片失败', error);
      return [];
    }
  }

  /**
     * 获取背景图片
     * @returns {Array}
     */
  getBackgroundImages() {
    const bgImages = [];
    try {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;

        if (bgImage && bgImage !== 'none') {
          const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (urlMatch && this.isSupportedFormat(urlMatch[1])) {
            bgImages.push({
              element: el,
              src: urlMatch[1],
              type: 'background'
            });
          }
        }
      });
    } catch (error) {
      console.error('OCR翻译器: 获取背景图片失败', error);
    }
    return bgImages;
  }

  /**
     * 检查图片是否可见
     * @param {HTMLElement} img - 图片元素
     * @returns {boolean}
     */
  isImageVisible(img) {
    try {
      const rect = img.getBoundingClientRect();
      const style = window.getComputedStyle(img);

      return rect.width > 0 &&
                   rect.height > 0 &&
                   style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   style.opacity !== '0';
    } catch (error) {
      return false;
    }
  }

  /**
     * 将图片转换为Canvas
     * @param {string} imageSrc - 图片源
     * @returns {Promise<ImageData>}
     */
  async imageToCanvas(imageSrc) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            // 设置Canvas尺寸
            this.canvas.width = img.naturalWidth || img.width;
            this.canvas.height = img.naturalHeight || img.height;

            // 清空Canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制图片
            this.ctx.drawImage(img, 0, 0);

            // 获取图片数据
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            resolve(imageData);
          } catch (error) {
            reject(new Error(`Canvas处理失败: ${error.message}`));
          }
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        img.src = imageSrc;
      } catch (error) {
        reject(new Error(`图片处理失败: ${error.message}`));
      }
    });
  }

  /**
     * 使用OCR进行文字识别
     * @param {ImageData} imageData - 图片数据
     * @returns {Promise<string>}
     */
  async performOCR(imageData) {
    try {
      // 这里使用简化的OCR实现
      // 在实际项目中，可以集成Tesseract.js或其他OCR库
      return await this.simulateOCR(imageData);
    } catch (error) {
      console.error('OCR识别失败:', error);
      throw new Error(`OCR识别失败: ${error.message}`);
    }
  }

  /**
     * 模拟OCR识别（简化实现）
     * @param {ImageData} imageData - 图片数据
     * @returns {Promise<string>}
     */
  async simulateOCR(imageData) {
    return new Promise((resolve) => {
      // 模拟异步OCR处理
      setTimeout(() => {
        // 这里应该是真实的OCR逻辑
        // 目前返回模拟文本用于测试
        const mockText = this.extractMockText(imageData);
        resolve(mockText);
      }, 100);
    });
  }

  /**
     * 提取模拟文本（用于测试）
     * @param {ImageData} imageData - 图片数据
     * @returns {string}
     */
  extractMockText(imageData) {
    // 简单的图片分析，检测是否包含文字特征
    const data = imageData.data;
    let textLikePixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      // 检测文字特征（黑白对比）
      if (brightness < 100 || brightness > 200) {
        textLikePixels++;
      }
    }

    const textRatio = textLikePixels / (data.length / 4);

    if (textRatio > 0.1) {
      return 'Sample text detected in image';
    }

    return '';
  }

  /**
     * 翻译识别出的文本
     * @param {string} text - 识别的文本
     * @returns {Promise<string>}
     */
  async translateText(text) {
    try {
      if (!text || text.trim().length === 0) {
        return '';
      }

      // 调用现有的翻译服务
      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'translate',
            text: text.trim(),
            source: 'ocr'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
              resolve(response.translatedText || '');
            } else {
              reject(new Error(response?.error || '翻译失败'));
            }
          });
        });
      } else {
        throw new Error('Chrome扩展环境不可用');
      }
    } catch (error) {
      console.error('OCR文本翻译失败:', error);
      throw error;
    }
  }

  /**
     * 创建翻译结果显示元素
     * @param {HTMLElement} imageElement - 图片元素
     * @param {string} originalText - 原始文本
     * @param {string} translatedText - 翻译文本
     */
  createTranslationOverlay(imageElement, originalText, translatedText) {
    try {
      // 检查是否已存在翻译覆盖层
      const existingOverlay = imageElement.parentNode?.querySelector('.ocr-translation-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      if (!translatedText || translatedText.trim().length === 0) {
        return;
      }

      const overlay = document.createElement('div');
      overlay.className = 'ocr-translation-overlay';
      overlay.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                max-width: 200px;
                word-wrap: break-word;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;

      // 创建内容
      const content = document.createElement('div');
      if (originalText && originalText !== translatedText) {
        content.innerHTML = `
                    <div style="opacity: 0.7; font-size: 10px; margin-bottom: 4px;">${this.escapeHtml(originalText)}</div>
                    <div>${this.escapeHtml(translatedText)}</div>
                `;
      } else {
        content.textContent = translatedText;
      }

      overlay.appendChild(content);

      // 定位覆盖层
      this.positionOverlay(overlay, imageElement);

      // 添加到页面
      document.body.appendChild(overlay);

      // 自动隐藏
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 5000);

    } catch (error) {
      console.error('OCR翻译器: 创建翻译覆盖层失败', error);
    }
  }

  /**
     * 定位覆盖层
     * @param {HTMLElement} overlay - 覆盖层元素
     * @param {HTMLElement} imageElement - 图片元素
     */
  positionOverlay(overlay, imageElement) {
    try {
      const rect = imageElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      overlay.style.left = `${rect.left + scrollLeft}px`;
      overlay.style.top = `${rect.top + scrollTop}px`;
    } catch (error) {
      console.error('OCR翻译器: 定位覆盖层失败', error);
    }
  }

  /**
     * HTML转义
     * @param {string} text - 需要转义的文本
     * @returns {string}
     */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
     * 翻译页面中的所有图片
     */
  async translatePageImages() {
    try {
      if (this.isProcessing) {
        console.log('OCR翻译器: 正在处理中，跳过此次请求');
        return;
      }

      this.isProcessing = true;
      const images = this.getPageImages();

      console.log(`OCR翻译器: 找到 ${images.length} 张图片`);

      for (const imageInfo of images) {
        try {
          await this.translateSingleImage(imageInfo);
        } catch (error) {
          console.error('OCR翻译器: 翻译单张图片失败', error);
        }
      }
    } catch (error) {
      console.error('OCR翻译器: 翻译页面图片失败', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
     * 翻译单张图片
     * @param {Object} imageInfo - 图片信息
     */
  async translateSingleImage(imageInfo) {
    try {
      const { element, src } = imageInfo;

      // 检查是否已处理过
      if (this.processedImages.has(src)) {
        return;
      }

      // 标记为已处理
      this.processedImages.add(src);

      // 转换图片为Canvas数据
      const imageData = await this.imageToCanvas(src);

      // 执行OCR识别
      const recognizedText = await this.performOCR(imageData);

      if (recognizedText && recognizedText.trim().length > 0) {
        // 翻译识别的文本
        const translatedText = await this.translateText(recognizedText);

        // 显示翻译结果
        this.createTranslationOverlay(element, recognizedText, translatedText);
      }
    } catch (error) {
      console.error('OCR翻译器: 翻译单张图片失败', error);
    }
  }

  /**
     * 初始化OCR翻译器
     */
  async init() {
    try {
      console.log('OCR翻译器: 初始化开始');

      // 检查必要的API支持
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas不支持');
      }

      // 初始化完成
      console.log('OCR翻译器: 初始化完成');
      return true;
    } catch (error) {
      console.error('OCR翻译器: 初始化失败', error);
      throw error;
    }
  }

  /**
     * 销毁OCR翻译器
     */
  destroy() {
    try {
      console.log('OCR翻译器: 开始销毁');

      // 清除页面翻译
      this.clearPageTranslations();

      // 重置状态
      this.isProcessing = false;
      this.processedImages.clear();

      // 清理Canvas
      if (this.canvas) {
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.canvas = null;
        this.ctx = null;
      }

      console.log('OCR翻译器: 销毁完成');
    } catch (error) {
      console.error('OCR翻译器: 销毁失败', error);
    }
  }

  /**
     * 清除页面翻译
     */
  clearPageTranslations() {
    try {
      // 移除所有翻译覆盖层
      document.querySelectorAll('.ocr-translation-overlay').forEach(overlay => {
        overlay.remove();
      });

      // 重置处理状态
      this.processedImages.clear();
    } catch (error) {
      console.error('OCR翻译器: 清除页面翻译失败', error);
    }
  }
}

// 导出OCR翻译器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCRTranslator;
} else if (typeof window !== 'undefined') {
  window.OCRTranslator = OCRTranslator;
}
