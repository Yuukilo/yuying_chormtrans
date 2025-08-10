/**
 * 语影翻译插件 - 翻译服务管理器
 * 整合API适配器、缓存管理器和prompt管理器，提供统一的翻译服务接口
 */

class TranslationService {
  constructor() {
    this.adapters = new Map();
    this.promptManager = new globalThis.PromptManager();
    this.cacheManager = new globalThis.CacheManager();
    this.currentProvider = 'deepseek';
    this.isInitialized = false;
    this.settings = {};

    // 故障转移配置
    this.fallbackProviders = ['deepseek', 'tongyi', 'wenxin', 'openai', 'gemini'];
    this.maxRetries = 3;
    this.retryDelay = 1000;

    this.initialize();
  }

  /**
   * 初始化翻译服务
   */
  async initialize() {
    try {
      // 加载用户设置
      await this.loadSettings();

      // 注册所有API适配器
      this.registerAdapters();

      // 设置当前提供商
      this.setProvider(this.settings.apiProvider || 'deepseek');

      this.isInitialized = true;
      console.log('翻译服务初始化完成');
    } catch (error) {
      console.error('翻译服务初始化失败:', error);
    }
  }

  /**
   * 加载用户设置
   */
  async loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['yuying_settings'], (result) => {
          this.settings = result.yuying_settings || this.getDefaultSettings();
          resolve();
        });
      } else {
        // 如果chrome.storage不可用，使用默认设置
        this.settings = this.getDefaultSettings();
        resolve();
      }
    });
  }

  /**
   * 获取默认设置
   */
  getDefaultSettings() {
    return {
      apiKey: '',
      apiProvider: 'deepseek',
      targetLanguage: 'zh-CN',
      autoTranslate: true, // 默认开启自动翻译
      positionPreference: 'right',
      fontSize: 14,
      transparency: 0.8,
      shortcuts: {
        toggle: 'Alt+T',
        settings: 'Alt+S'
      }
    };
  }

  /**
   * 注册所有API适配器
   */
  registerAdapters() {
    // 注册DeepSeek适配器
    this.registerAdapter('deepseek', () => new globalThis.DeepSeekAdapter(this.settings.apiKey));

    // 注册通义千问适配器
    this.registerAdapter('tongyi', () => new globalThis.TongyiAdapter(this.settings.apiKey));

    // 注册OpenAI适配器
    this.registerAdapter('openai', () => new globalThis.OpenAIAdapter(this.settings.apiKey));

    // 注册Gemini适配器
    this.registerAdapter('gemini', () => new globalThis.GeminiAdapter(this.settings.apiKey));

    // 注册文心一言适配器
    this.registerAdapter('wenxin', () => new globalThis.WenxinAdapter(this.settings.apiKey));
  }

  /**
   * 注册API适配器
   * @param {string} provider - 提供商名称
   * @param {Function} adapterFactory - 适配器工厂函数
   */
  registerAdapter(provider, adapterFactory) {
    this.adapters.set(provider, adapterFactory);
  }

  /**
   * 设置当前API提供商
   * @param {string} provider - 提供商名称
   */
  setProvider(provider) {
    if (this.adapters.has(provider)) {
      this.currentProvider = provider;
      console.log(`切换到API提供商: ${provider}`);
    } else {
      console.warn(`未知的API提供商: ${provider}`);
    }
  }

  /**
   * 获取当前适配器实例
   * @returns {TranslationAPIAdapter} 适配器实例
   */
  getCurrentAdapter() {
    const adapterFactory = this.adapters.get(this.currentProvider);
    if (!adapterFactory) {
      throw new Error(`未找到提供商 ${this.currentProvider} 的适配器`);
    }
    return adapterFactory();
  }

  /**
   * 执行翻译
   * @param {string} text - 待翻译文本
   * @param {Object} options - 翻译选项
   * @returns {Promise<Object>} 翻译结果
   */
  async translate(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 参数验证
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('翻译文本不能为空');
    }

    if (!this.settings.apiKey || this.settings.apiKey.trim() === '') {
      throw new Error('请先配置API密钥');
    }

    const {
      sourceLang = 'auto',
      targetLang = this.settings.targetLanguage || 'zh-CN',
      promptType,
      context = '',
      useCache = true,
      forceRefresh = false
    } = options;

    // 文本预处理
    const processedText = this.preprocessText(text);

    // 智能选择prompt类型
    const finalPromptType = promptType || this.promptManager.detectPromptType(processedText, context);

    // 检查缓存
    if (useCache && !forceRefresh) {
      const cached = await this.cacheManager.get(processedText, targetLang, finalPromptType);
      if (cached) {
        console.log('使用缓存翻译结果');
        return cached;
      }
    }

    // 执行翻译
    let result;
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        result = await this.executeTranslation(processedText, {
          sourceLang,
          targetLang,
          promptType: finalPromptType,
          context
        });

        // 翻译成功，缓存结果
        if (useCache && result.translatedText) {
          await this.cacheManager.set(
            processedText,
            result.translatedText,
            targetLang,
            finalPromptType,
            {
              detectedLang: result.detectedLang,
              confidence: result.confidence
            }
          );
        }

        // 更新使用统计
        await this.updateUsageStats(processedText, result);

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`翻译尝试 ${attempt + 1} 失败:`, error.message);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    // 所有重试都失败，尝试故障转移
    try {
      result = await this.handleFailover(processedText, {
        sourceLang,
        targetLang,
        promptType: finalPromptType,
        context
      });

      if (useCache && result.translatedText) {
        await this.cacheManager.set(
          processedText,
          result.translatedText,
          targetLang,
          finalPromptType
        );
      }

      return result;
    } catch (failoverError) {
      console.error('故障转移也失败了:', failoverError);
      throw lastError || failoverError;
    }
  }

  /**
   * 执行翻译（单次尝试）
   * @param {string} text - 文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 翻译结果
   */
  async executeTranslation(text, options) {
    const adapter = this.getCurrentAdapter();

    // 构建prompt变量
    const promptVariables = {
      source_text: text,
      current_text: text,
      context: options.context || ''
    };

    const result = await adapter.translate(text, {
      promptType: options.promptType,
      promptVariables,
      sourceLang: options.sourceLang,
      targetLang: options.targetLang
    });

    // 后处理翻译结果
    result.translatedText = this.postprocessText(result.translatedText);
    result.provider = this.currentProvider;
    result.timestamp = Date.now();

    return result;
  }

  /**
   * 故障转移处理
   * @param {string} text - 文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 翻译结果
   */
  async handleFailover(text, options) {
    const originalProvider = this.currentProvider;
    const fallbackList = this.fallbackProviders.filter(p => p !== originalProvider);

    for (const provider of fallbackList) {
      if (!this.adapters.has(provider)) {
        continue;
      }

      try {
        console.log(`尝试故障转移到: ${provider}`);
        this.setProvider(provider);

        const result = await this.executeTranslation(text, options);
        result.isFailover = true;
        result.originalProvider = originalProvider;

        console.log(`故障转移成功: ${provider}`);
        return result;
      } catch (error) {
        console.warn(`故障转移到 ${provider} 失败:`, error.message);
        continue;
      }
    }

    // 恢复原始提供商
    this.setProvider(originalProvider);
    throw new Error('所有API提供商都不可用');
  }

  /**
   * 文本预处理
   * @param {string} text - 原文本
   * @returns {string} 处理后的文本
   */
  preprocessText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')  // 多个空格合并
      .replace(/\n\s*\n/g, '\n')  // 多个换行合并
      .substring(0, 5000);  // 限制长度
  }

  /**
   * 翻译结果后处理
   * @param {string} text - 翻译结果
   * @returns {string} 处理后的结果
   */
  postprocessText(text) {
    return text
      .trim()
      .replace(/^["'`]|["'`]$/g, '')  // 移除首尾引号
      .replace(/\n\s*\n/g, '\n');  // 清理多余换行
  }

  /**
   * 更新使用统计
   * @param {string} text - 原文本
   * @param {Object} result - 翻译结果
   */
  async updateUsageStats(text, result) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = 'yuying_usage_stats';

      const getStats = () => new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get([statsKey], (data) => {
            resolve(data[statsKey] || { daily: {}, total: {} });
          });
        } else {
          // 如果chrome.storage不可用，返回默认统计
          resolve({ daily: {}, total: {} });
        }
      });

      const setStats = (stats) => new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ [statsKey]: stats }, resolve);
        } else {
          // 如果chrome.storage不可用，直接resolve
          resolve();
        }
      });

      const stats = await getStats();

      // 初始化今日统计
      if (!stats.daily[today]) {
        stats.daily[today] = {
          apiCalls: 0,
          cacheHits: 0,
          charactersTranslated: 0,
          pagesTranslated: new Set()
        };
      }

      // 初始化总统计
      if (!stats.total) {
        stats.total = {
          apiCalls: 0,
          cacheHits: 0,
          charactersTranslated: 0,
          pagesTranslated: 0,
          firstUseDate: Date.now()
        };
      }

      // 更新统计
      const increment = result.fromCache ? 0 : 1;
      stats.daily[today].apiCalls += increment;
      stats.daily[today].charactersTranslated += text.length;
      stats.total.apiCalls += increment;
      stats.total.charactersTranslated += text.length;

      if (result.fromCache) {
        stats.daily[today].cacheHits += 1;
        stats.total.cacheHits += 1;
      }

      await setStats(stats);
    } catch (error) {
      console.error('更新使用统计失败:', error);
    }
  }

  /**
   * 翻译图片中的文字
   * @param {string} imageData - 图片数据（base64格式）
   * @param {Object} options - 翻译选项
   * @returns {Promise<Object>} 翻译结果
   */
  async translateImage(imageData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 参数验证
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('图片数据不能为空');
    }

    if (!this.settings.apiKey || this.settings.apiKey.trim() === '') {
      throw new Error('请先配置API密钥');
    }

    const {
      targetLang = this.settings.targetLanguage || 'zh-CN',
      useCache = true,
      forceRefresh = false
    } = options;

    // 生成图片缓存键
    const imageHash = this.generateImageHash(imageData);
    const cacheKey = `ocr_${imageHash}_${targetLang}`;

    // 检查缓存
    if (useCache && !forceRefresh) {
      const cached = await this.cacheManager.get(cacheKey, targetLang, 'ocr');
      if (cached) {
        console.log('使用缓存OCR翻译结果');
        return cached;
      }
    }

    try {
      // 执行OCR和翻译
      const result = await this.executeImageTranslation(imageData, { targetLang });

      // 缓存结果
      if (useCache && result.text) {
        await this.cacheManager.set(
          cacheKey,
          result.text,
          targetLang,
          'ocr',
          {
            originalText: result.originalText,
            confidence: result.confidence
          }
        );
      }

      // 更新使用统计
      await this.updateImageUsageStats(result);

      return result;
    } catch (error) {
      console.error('图片翻译失败:', error);
      throw error;
    }
  }

  /**
   * 执行图片翻译
   * @param {string} imageData - 图片数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 翻译结果
   */
  async executeImageTranslation(imageData, options) {
    const adapter = this.getCurrentAdapter();

    // 检查适配器是否支持图片翻译
    if (typeof adapter.translateImage === 'function') {
      // 使用适配器的图片翻译功能
      return await adapter.translateImage(imageData, options);
    } else {
      // 使用通用OCR + 翻译方案
      return await this.fallbackImageTranslation(imageData, options);
    }
  }

  /**
   * 通用图片翻译方案（OCR + 文本翻译）
   * @param {string} imageData - 图片数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 翻译结果
   */
  async fallbackImageTranslation(imageData, options) {
    try {
      // 使用浏览器内置OCR或第三方服务
      const ocrResult = await this.performOCR(imageData);

      if (!ocrResult.text || ocrResult.text.trim() === '') {
        throw new Error('图片中未检测到文字');
      }

      // 翻译识别出的文字
      const translationResult = await this.translate(ocrResult.text, {
        targetLang: options.targetLang,
        promptType: 'general',
        useCache: true
      });

      return {
        text: translationResult.translatedText,
        originalText: ocrResult.text,
        confidence: ocrResult.confidence || 0.8,
        provider: this.currentProvider,
        timestamp: Date.now(),
        isOCR: true
      };
    } catch (error) {
      throw new Error(`图片翻译失败: ${error.message}`);
    }
  }

  /**
   * 执行OCR识别
   * @param {string} _imageData - 图片数据
   * @returns {Promise<Object>} OCR结果
   */
  async performOCR(_imageData) {
    // 这里可以集成多种OCR服务
    // 目前使用简单的模拟实现
    try {
      // 模拟OCR处理
      await this.delay(1000); // 模拟处理时间

      // 实际应用中，这里应该调用真实的OCR API
      // 例如：Google Cloud Vision API, Azure Computer Vision, 百度OCR等

      // 临时返回模拟结果
      return {
        text: '检测到图片中的文字内容', // 实际应该是OCR识别的结果
        confidence: 0.85
      };
    } catch (error) {
      throw new Error(`OCR识别失败: ${error.message}`);
    }
  }

  /**
   * 生成图片哈希值
   * @param {string} imageData - 图片数据
   * @returns {string} 哈希值
   */
  generateImageHash(imageData) {
    // 简单的哈希生成，实际应用中可以使用更复杂的算法
    let hash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 更新图片翻译使用统计
   */
  async updateImageUsageStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = 'yuying_image_stats';

      const getStats = () => new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get([statsKey], (data) => {
            resolve(data[statsKey] || { daily: {}, total: {} });
          });
        } else {
          resolve({ daily: {}, total: {} });
        }
      });

      const setStats = (stats) => new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ [statsKey]: stats }, resolve);
        } else {
          resolve();
        }
      });

      const stats = await getStats();

      // 初始化统计
      if (!stats.daily[today]) {
        stats.daily[today] = { imageTranslations: 0 };
      }
      if (!stats.total) {
        stats.total = { imageTranslations: 0 };
      }

      // 更新统计
      stats.daily[today].imageTranslations += 1;
      stats.total.imageTranslations += 1;

      await setStats(stats);
    } catch (error) {
      console.error('更新图片翻译统计失败:', error);
    }
  }

  /**
   * 测试API连接
   * @param {string} provider - 提供商名称
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(provider = this.currentProvider, apiKey = this.settings.apiKey) {
    try {
      const originalKey = this.settings.apiKey;
      const originalProvider = this.currentProvider;

      // 临时设置
      this.settings.apiKey = apiKey;
      this.setProvider(provider);

      const testText = 'Hello, world!';
      const startTime = Date.now();

      const result = await this.executeTranslation(testText, {
        targetLang: 'zh-CN',
        promptType: 'general'
      });

      const responseTime = Date.now() - startTime;

      // 恢复原始设置
      this.settings.apiKey = originalKey;
      this.setProvider(originalProvider);

      return {
        success: true,
        provider,
        responseTime,
        translatedText: result.translatedText,
        message: `连接成功，响应时间: ${responseTime}ms`
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error.message,
        message: `连接失败: ${error.message}`
      };
    }
  }

  /**
   * 更新设置
   * @param {Object} newSettings - 新设置
   */
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    // 保存到存储
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ yuying_settings: this.settings });
    } else {
      // 如果chrome.storage不可用，设置无法持久化
      console.warn('Chrome storage不可用，设置无法持久化');
    }

    // 重新注册适配器（如果API密钥改变）
    if (newSettings.apiKey || newSettings.apiProvider) {
      this.registerAdapters();
      if (newSettings.apiProvider) {
        this.setProvider(newSettings.apiProvider);
      }
    }
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentProvider: this.currentProvider,
      hasApiKey: !!(this.settings.apiKey && this.settings.apiKey.trim()),
      availableProviders: Array.from(this.adapters.keys()),
      settings: { ...this.settings, apiKey: this.settings.apiKey ? '***' : '' }
    };
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出TranslationService类
export default TranslationService;
