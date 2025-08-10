/**
 * 语影翻译插件 - 缓存管理器
 * 提供翻译结果的本地缓存功能，提升响应速度和用户体验
 */

class CacheManager {
  constructor() {
    this.CACHE_KEY = 'yuying_translation_cache';
    this.STATS_KEY = 'yuying_cache_stats';
    this.CACHE_LIMIT = 1000; // 最大缓存条目数
    this.CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7天过期时间
    this.CLEANUP_THRESHOLD = 0.8; // 清理时保留80%的容量

    // 初始化统计数据
    this.initializeStats();
  }

  /**
   * 初始化缓存统计数据
   */
  async initializeStats() {
    const stats = await this.getStats();
    if (!stats.initialized) {
      await this.setStats({
        initialized: true,
        totalHits: 0,
        totalMisses: 0,
        totalSaves: 0,
        lastCleanup: Date.now(),
        cacheSize: 0
      });
    }
  }

  /**
   * 生成缓存键
   * @param {string} text - 原文本
   * @param {string} targetLang - 目标语言
   * @param {string} promptType - prompt类型
   * @returns {string} 缓存键
   */
  generateKey(text, targetLang = 'zh-CN', promptType = 'general') {
    const normalizedText = this.normalizeText(text);
    const hash = this.simpleHash(normalizedText + targetLang + promptType);
    return `${hash}_${targetLang}_${promptType}`;
  }

  /**
   * 文本标准化处理
   * @param {string} text - 原文本
   * @returns {string} 标准化后的文本
   */
  normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')  // 多个空格合并为一个
      .replace(/[\r\n]+/g, ' ')  // 换行符替换为空格
      .substring(0, 500);  // 限制长度，避免键过长
  }

  /**
   * 简单哈希函数
   * @param {string} str - 输入字符串
   * @returns {string} 哈希值
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取缓存项
   * @param {string} text - 原文本
   * @param {string} targetLang - 目标语言
   * @param {string} promptType - prompt类型
   * @returns {Promise<Object|null>} 缓存的翻译结果
   */
  async get(text, targetLang = 'zh-CN', promptType = 'general') {
    try {
      const key = this.generateKey(text, targetLang, promptType);
      const cache = await this.getCache();
      const item = cache[key];

      if (!item) {
        await this.incrementStats('totalMisses');
        return null;
      }

      // 检查是否过期
      if (Date.now() - item.createdAt > this.CACHE_EXPIRE) {
        await this.remove(key);
        await this.incrementStats('totalMisses');
        return null;
      }

      // 更新访问统计
      item.accessCount++;
      item.lastAccessed = Date.now();
      cache[key] = item;
      await this.setCache(cache);
      await this.incrementStats('totalHits');

      return {
        translatedText: item.translatedText,
        originalText: item.originalText,
        detectedLang: item.detectedLang || 'auto',
        confidence: item.confidence || 0.9,
        fromCache: true,
        cachedAt: item.createdAt,
        accessCount: item.accessCount
      };
    } catch (error) {
      console.error('缓存获取错误:', error);
      return null;
    }
  }

  /**
   * 设置缓存项
   * @param {string} text - 原文本
   * @param {string} translatedText - 翻译结果
   * @param {string} targetLang - 目标语言
   * @param {string} promptType - prompt类型
   * @param {Object} metadata - 额外元数据
   * @returns {Promise<boolean>} 是否成功保存
   */
  async set(text, translatedText, targetLang = 'zh-CN', promptType = 'general', metadata = {}) {
    try {
      if (!text || !translatedText) {
        return false;
      }

      const key = this.generateKey(text, targetLang, promptType);
      const cache = await this.getCache();

      // 检查缓存大小限制
      if (Object.keys(cache).length >= this.CACHE_LIMIT) {
        await this.cleanupCache(cache);
      }

      // 创建缓存项
      const cacheItem = {
        originalText: text.substring(0, 1000), // 限制存储长度
        translatedText: translatedText.substring(0, 2000),
        targetLang,
        promptType,
        detectedLang: metadata.detectedLang || 'auto',
        confidence: metadata.confidence || 0.9,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        textLength: text.length,
        translationLength: translatedText.length
      };

      cache[key] = cacheItem;
      await this.setCache(cache);
      await this.incrementStats('totalSaves');
      await this.updateCacheSize();

      return true;
    } catch (error) {
      console.error('缓存保存错误:', error);
      return false;
    }
  }

  /**
   * 移除缓存项
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>} 是否成功移除
   */
  async remove(key) {
    try {
      const cache = await this.getCache();
      if (cache[key]) {
        delete cache[key];
        await this.setCache(cache);
        await this.updateCacheSize();
        return true;
      }
      return false;
    } catch (error) {
      console.error('缓存移除错误:', error);
      return false;
    }
  }

  /**
   * 清理过期和低频访问的缓存
   * @param {Object} cache - 当前缓存对象
   * @returns {Promise<void>}
   */
  async cleanupCache(cache) {
    try {
      const now = Date.now();
      const entries = Object.entries(cache);

      // 过滤有效条目并按访问频率排序
      const validEntries = entries
        .filter(([_, item]) => now - item.createdAt < this.CACHE_EXPIRE)
        .map(([key, item]) => ({
          key,
          item,
          score: this.calculateCacheScore(item, now)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.floor(this.CACHE_LIMIT * this.CLEANUP_THRESHOLD));

      // 重建缓存
      const cleanedCache = {};
      validEntries.forEach(({ key, item }) => {
        cleanedCache[key] = item;
      });

      await this.setCache(cleanedCache);
      await this.updateStats({ lastCleanup: now });

      console.log(`缓存清理完成: ${entries.length} -> ${validEntries.length}`);
    } catch (error) {
      console.error('缓存清理错误:', error);
    }
  }

  /**
   * 计算缓存项的重要性分数
   * @param {Object} item - 缓存项
   * @param {number} now - 当前时间戳
   * @returns {number} 分数
   */
  calculateCacheScore(item, now) {
    const ageWeight = 0.3;
    const accessWeight = 0.5;
    const recentWeight = 0.2;

    // 年龄分数（越新越好）
    const age = now - item.createdAt;
    const ageScore = Math.max(0, 1 - age / this.CACHE_EXPIRE);

    // 访问频率分数
    const accessScore = Math.min(1, item.accessCount / 10);

    // 最近访问分数
    const recentAccess = now - item.lastAccessed;
    const recentScore = Math.max(0, 1 - recentAccess / (24 * 60 * 60 * 1000)); // 24小时内

    return ageScore * ageWeight + accessScore * accessWeight + recentScore * recentWeight;
  }

  /**
   * 获取完整缓存对象
   * @returns {Promise<Object>} 缓存对象
   */
  async getCache() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([this.CACHE_KEY], (result) => {
          resolve(result[this.CACHE_KEY] || {});
        });
      } else {
        // 如果chrome.storage不可用，返回空对象
        resolve({});
      }
    });
  }

  /**
   * 保存缓存对象
   * @param {Object} cache - 缓存对象
   * @returns {Promise<void>}
   */
  async setCache(cache) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [this.CACHE_KEY]: cache }, resolve);
      } else {
        // 如果chrome.storage不可用，直接resolve
        resolve();
      }
    });
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([this.STATS_KEY], (result) => {
          resolve(result[this.STATS_KEY] || {});
        });
      } else {
        // 如果chrome.storage不可用，返回空对象
        resolve({});
      }
    });
  }

  /**
   * 保存统计信息
   * @param {Object} stats - 统计信息
   * @returns {Promise<void>}
   */
  async setStats(stats) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [this.STATS_KEY]: stats }, resolve);
      } else {
        // 如果chrome.storage不可用，直接resolve
        resolve();
      }
    });
  }

  /**
   * 增加统计计数
   * @param {string} key - 统计键
   * @param {number} increment - 增量
   * @returns {Promise<void>}
   */
  async incrementStats(key, increment = 1) {
    const stats = await this.getStats();
    stats[key] = (stats[key] || 0) + increment;
    await this.setStats(stats);
  }

  /**
   * 更新统计信息
   * @param {Object} updates - 更新的字段
   * @returns {Promise<void>}
   */
  async updateStats(updates) {
    const stats = await this.getStats();
    Object.assign(stats, updates);
    await this.setStats(stats);
  }

  /**
   * 更新缓存大小统计
   * @returns {Promise<void>}
   */
  async updateCacheSize() {
    const cache = await this.getCache();
    const size = Object.keys(cache).length;
    await this.updateStats({ cacheSize: size });
  }

  /**
   * 获取缓存命中率
   * @returns {Promise<number>} 命中率（0-1）
   */
  async getHitRate() {
    const stats = await this.getStats();
    const total = (stats.totalHits || 0) + (stats.totalMisses || 0);
    return total > 0 ? (stats.totalHits || 0) / total : 0;
  }

  /**
   * 清空所有缓存
   * @returns {Promise<void>}
   */
  async clearAll() {
    await this.setCache({});
    await this.setStats({
      initialized: true,
      totalHits: 0,
      totalMisses: 0,
      totalSaves: 0,
      lastCleanup: Date.now(),
      cacheSize: 0
    });
  }

  /**
   * 获取缓存使用情况报告
   * @returns {Promise<Object>} 使用报告
   */
  async getUsageReport() {
    const stats = await this.getStats();
    const cache = await this.getCache();
    const hitRate = await this.getHitRate();

    return {
      cacheSize: Object.keys(cache).length,
      maxSize: this.CACHE_LIMIT,
      hitRate: Math.round(hitRate * 100),
      totalHits: stats.totalHits || 0,
      totalMisses: stats.totalMisses || 0,
      totalSaves: stats.totalSaves || 0,
      lastCleanup: stats.lastCleanup || 0,
      oldestEntry: this.getOldestEntry(cache),
      newestEntry: this.getNewestEntry(cache)
    };
  }

  /**
   * 获取最旧的缓存条目时间
   * @param {Object} cache - 缓存对象
   * @returns {number} 时间戳
   */
  getOldestEntry(cache) {
    const entries = Object.values(cache);
    if (entries.length === 0) return 0;
    return Math.min(...entries.map(item => item.createdAt));
  }

  /**
   * 获取最新的缓存条目时间
   * @param {Object} cache - 缓存对象
   * @returns {number} 时间戳
   */
  getNewestEntry(cache) {
    const entries = Object.values(cache);
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(item => item.createdAt));
  }
}

// 导出CacheManager类
export default CacheManager;
