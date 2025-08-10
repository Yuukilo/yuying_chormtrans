# API文档 (API Documentation)

本文档详细说明了语影翻译插件的API接口和内部架构。

## 📋 目录

- [核心API](#核心api)
- [翻译服务API](#翻译服务api)
- [消息通信API](#消息通信api)
- [存储API](#存储api)
- [缓存API](#缓存api)
- [OCR API](#ocr-api)
- [设置API](#设置api)
- [事件API](#事件api)

## 🔧 核心API

### TranslationManager

主要的翻译管理器，负责协调各个翻译服务。

```javascript
class TranslationManager {
  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {Object} options - 翻译选项
   * @param {string} options.from - 源语言代码
   * @param {string} options.to - 目标语言代码
   * @param {string} options.service - 翻译服务名称
   * @returns {Promise<TranslationResult>} 翻译结果
   */
  async translateText(text, options) {}
  
  /**
   * 获取支持的语言列表
   * @param {string} service - 翻译服务名称
   * @returns {Promise<Language[]>} 支持的语言列表
   */
  async getSupportedLanguages(service) {}
  
  /**
   * 检测文本语言
   * @param {string} text - 要检测的文本
   * @returns {Promise<string>} 检测到的语言代码
   */
  async detectLanguage(text) {}
}
```

### 数据类型

```typescript
interface TranslationResult {
  text: string;           // 翻译结果
  from: string;          // 源语言
  to: string;            // 目标语言
  service: string;       // 使用的翻译服务
  timestamp: number;     // 翻译时间戳
  cached: boolean;       // 是否来自缓存
}

interface Language {
  code: string;          // 语言代码 (如 'en', 'zh')
  name: string;          // 语言名称 (如 'English', '中文')
  nativeName: string;    // 本地语言名称
}

interface TranslationOptions {
  from?: string;         // 源语言，默认自动检测
  to: string;           // 目标语言
  service?: string;     // 翻译服务，默认使用设置中的服务
  useCache?: boolean;   // 是否使用缓存，默认true
  priority?: number;    // 优先级，默认0
}
```

## 🌐 翻译服务API

### 基础翻译服务接口

```javascript
class BaseTranslationService {
  /**
   * 服务名称
   * @returns {string} 服务名称
   */
  get name() {}
  
  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @returns {Promise<string>} 翻译结果
   */
  async translate(text, from, to) {}
  
  /**
   * 检测语言
   * @param {string} text - 要检测的文本
   * @returns {Promise<string>} 语言代码
   */
  async detectLanguage(text) {}
  
  /**
   * 获取支持的语言
   * @returns {Promise<Language[]>} 支持的语言列表
   */
  async getSupportedLanguages() {}
  
  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @returns {Promise<boolean>} 是否有效
   */
  async validateApiKey(apiKey) {}
}
```

### DeepSeek翻译服务

```javascript
class DeepSeekTranslationService extends BaseTranslationService {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com';
  }
  
  async translate(text, from, to) {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: `请将以下${from}文本翻译成${to}：\n${text}`
          }
        ]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

### OpenAI翻译服务

```javascript
class OpenAITranslationService extends BaseTranslationService {
  constructor(apiKey, model = 'gpt-3.5-turbo') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.openai.com';
  }
  
  async translate(text, from, to) {
    // 实现OpenAI翻译逻辑
  }
}
```

## 📨 消息通信API

### Background Script消息处理

```javascript
// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TRANSLATE_TEXT':
      handleTranslateText(message, sendResponse);
      break;
    case 'GET_SETTINGS':
      handleGetSettings(message, sendResponse);
      break;
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message, sendResponse);
      break;
    case 'GET_USAGE_STATS':
      handleGetUsageStats(message, sendResponse);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(message, sendResponse);
      break;
  }
  return true; // 保持消息通道开放
});
```

### 消息类型定义

```typescript
interface TranslateTextMessage {
  type: 'TRANSLATE_TEXT';
  text: string;
  options?: TranslationOptions;
}

interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  settings: Partial<Settings>;
}

interface GetUsageStatsMessage {
  type: 'GET_USAGE_STATS';
}

interface ClearCacheMessage {
  type: 'CLEAR_CACHE';
}
```

### Content Script通信

```javascript
// content.js
class ContentScriptAPI {
  /**
   * 发送翻译请求
   * @param {string} text - 要翻译的文本
   * @param {TranslationOptions} options - 翻译选项
   * @returns {Promise<TranslationResult>} 翻译结果
   */
  async translateText(text, options = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        text,
        options
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result);
        }
      });
    });
  }
  
  /**
   * 获取设置
   * @returns {Promise<Settings>} 当前设置
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve);
    });
  }
}
```

## 💾 存储API

### 设置存储

```javascript
class SettingsStorage {
  /**
   * 获取设置
   * @param {string|string[]} keys - 设置键名
   * @returns {Promise<Object>} 设置值
   */
  static async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }
  
  /**
   * 保存设置
   * @param {Object} settings - 要保存的设置
   * @returns {Promise<void>}
   */
  static async set(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, resolve);
    });
  }
  
  /**
   * 删除设置
   * @param {string|string[]} keys - 要删除的键名
   * @returns {Promise<void>}
   */
  static async remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }
}
```

### 默认设置

```javascript
const DEFAULT_SETTINGS = {
  // 翻译设置
  translationService: 'deepseek',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
  
  // API设置
  apiKeys: {
    deepseek: '',
    openai: '',
    claude: '',
    gemini: ''
  },
  
  // 界面设置
  showTranslationBox: true,
  translationBoxPosition: 'auto',
  translationBoxOpacity: 0.9,
  fontSize: 14,
  
  // 功能设置
  enableHoverTranslation: true,
  enableSelectionTranslation: true,
  enableOCRTranslation: true,
  enableCache: true,
  
  // 快捷键设置
  toggleShortcut: 'Alt+T',
  settingsShortcut: 'Alt+S',
  
  // 高级设置
  maxCacheSize: 1000,
  requestTimeout: 10000,
  retryCount: 3
};
```

## 🗄️ 缓存API

### 缓存管理器

```javascript
class CacheManager {
  /**
   * 获取缓存的翻译结果
   * @param {string} text - 原文
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @param {string} service - 翻译服务
   * @returns {Promise<string|null>} 缓存的翻译结果
   */
  static async get(text, from, to, service) {
    const key = this.generateKey(text, from, to, service);
    const cache = await SettingsStorage.get(['translationCache']);
    return cache.translationCache?.[key] || null;
  }
  
  /**
   * 保存翻译结果到缓存
   * @param {string} text - 原文
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @param {string} service - 翻译服务
   * @param {string} result - 翻译结果
   * @returns {Promise<void>}
   */
  static async set(text, from, to, service, result) {
    const key = this.generateKey(text, from, to, service);
    const cache = await SettingsStorage.get(['translationCache']);
    const translationCache = cache.translationCache || {};
    
    translationCache[key] = {
      result,
      timestamp: Date.now()
    };
    
    // 限制缓存大小
    await this.limitCacheSize(translationCache);
    
    await SettingsStorage.set({ translationCache });
  }
  
  /**
   * 清空缓存
   * @returns {Promise<void>}
   */
  static async clear() {
    await SettingsStorage.remove(['translationCache']);
  }
  
  /**
   * 生成缓存键
   * @private
   */
  static generateKey(text, from, to, service) {
    return `${service}:${from}:${to}:${this.hashText(text)}`;
  }
  
  /**
   * 文本哈希
   * @private
   */
  static hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }
}
```

## 👁️ OCR API

### OCR翻译器

```javascript
class OCRTranslator {
  /**
   * 识别并翻译图片中的文字
   * @param {string} imageUrl - 图片URL
   * @param {TranslationOptions} options - 翻译选项
   * @returns {Promise<OCRResult>} OCR和翻译结果
   */
  static async translateImage(imageUrl, options = {}) {
    try {
      // 1. 提取图片中的文字
      const extractedText = await this.extractText(imageUrl);
      
      if (!extractedText.trim()) {
        throw new Error('未检测到文字');
      }
      
      // 2. 翻译提取的文字
      const translationResult = await TranslationManager.translateText(
        extractedText, 
        options
      );
      
      return {
        originalText: extractedText,
        translatedText: translationResult.text,
        language: translationResult.from,
        confidence: 0.9 // 模拟置信度
      };
    } catch (error) {
      throw new Error(`OCR翻译失败: ${error.message}`);
    }
  }
  
  /**
   * 从图片中提取文字
   * @private
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<string>} 提取的文字
   */
  static async extractText(imageUrl) {
    // 使用Tesseract.js或其他OCR服务
    // 这里是简化的实现
    return new Promise((resolve, reject) => {
      // OCR实现逻辑
      resolve('提取的文字内容');
    });
  }
}

interface OCRResult {
  originalText: string;    // 原始文字
  translatedText: string;  // 翻译结果
  language: string;        // 检测到的语言
  confidence: number;      // 识别置信度
}
```

## ⚙️ 设置API

### 设置管理器

```javascript
class SettingsManager {
  /**
   * 获取所有设置
   * @returns {Promise<Settings>} 当前设置
   */
  static async getAll() {
    const settings = await SettingsStorage.get(Object.keys(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...settings };
  }
  
  /**
   * 更新设置
   * @param {Partial<Settings>} newSettings - 新设置
   * @returns {Promise<void>}
   */
  static async update(newSettings) {
    const currentSettings = await this.getAll();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // 验证设置
    this.validateSettings(updatedSettings);
    
    await SettingsStorage.set(updatedSettings);
    
    // 触发设置更新事件
    this.notifySettingsChanged(updatedSettings);
  }
  
  /**
   * 重置设置
   * @returns {Promise<void>}
   */
  static async reset() {
    await SettingsStorage.clear();
    await SettingsStorage.set(DEFAULT_SETTINGS);
  }
  
  /**
   * 验证设置
   * @private
   */
  static validateSettings(settings) {
    // 验证API密钥格式
    if (settings.apiKeys) {
      Object.entries(settings.apiKeys).forEach(([service, key]) => {
        if (key && !this.isValidApiKey(service, key)) {
          throw new Error(`无效的${service} API密钥`);
        }
      });
    }
    
    // 验证语言代码
    if (settings.sourceLanguage && !this.isValidLanguageCode(settings.sourceLanguage)) {
      throw new Error('无效的源语言代码');
    }
    
    if (settings.targetLanguage && !this.isValidLanguageCode(settings.targetLanguage)) {
      throw new Error('无效的目标语言代码');
    }
  }
}
```

## 📊 事件API

### 事件管理器

```javascript
class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }
  
  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   */
  off(event, listener) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   */
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error);
        }
      });
    }
  }
}

// 全局事件管理器实例
const eventManager = new EventManager();

// 事件类型
const EVENTS = {
  TRANSLATION_START: 'translation:start',
  TRANSLATION_SUCCESS: 'translation:success',
  TRANSLATION_ERROR: 'translation:error',
  SETTINGS_CHANGED: 'settings:changed',
  CACHE_CLEARED: 'cache:cleared',
  OCR_START: 'ocr:start',
  OCR_SUCCESS: 'ocr:success',
  OCR_ERROR: 'ocr:error'
};
```

## 🔍 使用示例

### 基本翻译

```javascript
// 在content script中
const api = new ContentScriptAPI();

// 翻译文本
const result = await api.translateText('Hello World', {
  from: 'en',
  to: 'zh'
});
console.log(result.text); // "你好世界"

// 自动检测语言
const result2 = await api.translateText('Bonjour', {
  to: 'zh'
});
console.log(result2.from); // "fr"
console.log(result2.text); // "你好"
```

### 设置管理

```javascript
// 获取当前设置
const settings = await SettingsManager.getAll();
console.log(settings.translationService); // "deepseek"

// 更新设置
await SettingsManager.update({
  translationService: 'openai',
  targetLanguage: 'ja'
});

// 监听设置变化
eventManager.on(EVENTS.SETTINGS_CHANGED, (newSettings) => {
  console.log('设置已更新:', newSettings);
});
```

### OCR翻译

```javascript
// OCR翻译图片
const imageUrl = 'https://example.com/image.jpg';
const ocrResult = await OCRTranslator.translateImage(imageUrl, {
  to: 'zh'
});

console.log('原文:', ocrResult.originalText);
console.log('译文:', ocrResult.translatedText);
console.log('置信度:', ocrResult.confidence);
```

## 🚨 错误处理

### 错误类型

```javascript
class TranslationError extends Error {
  constructor(message, code, service) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.service = service;
  }
}

class APIError extends TranslationError {
  constructor(message, service, statusCode) {
    super(message, 'API_ERROR', service);
    this.statusCode = statusCode;
  }
}

class NetworkError extends TranslationError {
  constructor(message, service) {
    super(message, 'NETWORK_ERROR', service);
  }
}

class RateLimitError extends TranslationError {
  constructor(message, service, retryAfter) {
    super(message, 'RATE_LIMIT', service);
    this.retryAfter = retryAfter;
  }
}
```

### 错误处理示例

```javascript
try {
  const result = await api.translateText('Hello', { to: 'zh' });
  console.log(result.text);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`请求过于频繁，请在${error.retryAfter}秒后重试`);
  } else if (error instanceof APIError) {
    console.log(`API错误 (${error.statusCode}): ${error.message}`);
  } else if (error instanceof NetworkError) {
    console.log(`网络错误: ${error.message}`);
  } else {
    console.log(`翻译失败: ${error.message}`);
  }
}
```

---

**API文档持续更新中...** 📚✨

如有疑问，请查看源代码或提交Issue。