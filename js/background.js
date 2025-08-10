/**
 * 语影翻译插件 - Background Script
 * 处理扩展的后台逻辑、API调用、设置管理和跨页面通信
 */

// 静态导入所需的类
import PromptManager from './prompt-manager.js';
import CacheManager from './cache-manager.js';
import TranslationService from './translation-service.js';
import {
  DeepSeekAdapter,
  TongyiAdapter,
  OpenAIAdapter,
  GeminiAdapter,
  WenxinAdapter
} from './api-adapters.js';

// 将类添加到全局作用域
globalThis.PromptManager = PromptManager;
globalThis.CacheManager = CacheManager;
globalThis.TranslationService = TranslationService;
globalThis.DeepSeekAdapter = DeepSeekAdapter;
globalThis.TongyiAdapter = TongyiAdapter;
globalThis.OpenAIAdapter = OpenAIAdapter;
globalThis.GeminiAdapter = GeminiAdapter;
globalThis.WenxinAdapter = WenxinAdapter;

// 全局变量
let translationService = null;
let isTranslationEnabled = false;
let currentTabId = null;

// 初始化扩展
chrome.runtime.onInstalled.addListener(async (_details) => {
  console.log('语影翻译插件已安装');

  // 初始化默认设置
  await initializeDefaultSettings();

  // 创建右键菜单
  createContextMenus();

  // 初始化翻译服务
  await initializeTranslationService();

  // 设置初始图标状态
  await updateExtensionIcon(false);
});

// 扩展启动时初始化
chrome.runtime.onStartup.addListener(async () => {
  console.log('语影翻译插件启动');
  await initializeTranslationService();

  // 恢复翻译状态并更新图标
  await restoreTranslationState();
});

/**
 * 初始化默认设置
 */
async function initializeDefaultSettings() {
  const defaultSettings = {
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

  try {
    const result = await chrome.storage.sync.get(['yuying_settings']);
    if (!result.yuying_settings) {
      await chrome.storage.sync.set({ yuying_settings: defaultSettings });
      console.log('默认设置已初始化');
    }
  } catch (error) {
    console.error('初始化设置失败:', error);
  }
}

/**
 * 初始化翻译服务
 */
async function initializeTranslationService() {
  try {
    // 检查全局类是否已加载
    if (typeof globalThis.TranslationService === 'undefined') {
      console.error('翻译服务类未加载，请确保相关脚本已正确引入');
      return;
    }

    // 创建翻译服务实例
    translationService = new globalThis.TranslationService();
    await translationService.initialize();

    console.log('翻译服务初始化完成');
  } catch (error) {
    console.error('翻译服务初始化失败:', error);
  }
}

/**
 * 恢复翻译状态
 */
async function restoreTranslationState() {
  try {
    // 从存储中获取翻译状态
    const result = await chrome.storage.local.get(['yuying_translation_enabled']);
    isTranslationEnabled = result.yuying_translation_enabled || false;

    // 更新图标状态
    await updateExtensionIcon(isTranslationEnabled);

    console.log(`翻译状态已恢复: ${isTranslationEnabled ? '已激活' : '未激活'}`);
  } catch (error) {
    console.error('恢复翻译状态失败:', error);
    // 如果恢复失败，设置为未激活状态
    isTranslationEnabled = false;
    await updateExtensionIcon(false);
  }
}

/**
 * 创建右键菜单
 */
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: '翻译选中文本',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'toggle-translation',
      title: '切换翻译功能',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'open-settings',
      title: '打开设置',
      contexts: ['page']
    });
  });
}

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
  case 'translate-selection':
    if (info.selectionText) {
      await handleTranslateText(info.selectionText, tab.id);
    }
    break;
  case 'toggle-translation':
    await toggleTranslation(tab.id);
    break;
  case 'open-settings':
    chrome.action.openPopup();
    break;
  }
});

// 快捷键处理
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  switch (command) {
  case 'toggle-translation':
    await toggleTranslation(tab.id);
    break;
  case 'open-settings':
    chrome.action.openPopup();
    break;
  }
});

// 扩展图标点击处理
chrome.action.onClicked.addListener(async (tab) => {
  await toggleTranslation(tab.id);
});

// 消息处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 检查发送者是否有效 - 允许来自popup的消息（没有tab属性）
  if (!sender || (!sender.tab && !sender.url)) {
    console.error('无效的消息发送者');
    sendResponse({ success: false, message: '无效的消息发送者' });
    return false;
  }

  // 检查请求是否有效
  if (!request || !request.type) {
    console.error('无效的请求格式');
    sendResponse({ success: false, message: '无效的请求格式' });
    return false;
  }

  console.log('收到消息:', request.type, sender.tab?.id || 'popup');

  try {
    handleMessage(request, sender, sendResponse);
    return true; // 保持消息通道开放
  } catch (error) {
    console.error('处理消息时发生错误:', error);
    sendResponse({ success: false, message: '处理消息时发生错误: ' + error.message });
    return false;
  }
});

/**
 * 处理来自content script和popup的消息
 */
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.type) {
    case 'TRANSLATE_REQUEST':
      await handleTranslateRequest(request, sendResponse);
      break;

    case 'TOGGLE_TRANSLATION':
      await handleToggleTranslation(request, sendResponse);
      break;

    case 'GET_SETTINGS':
      await handleGetSettings(sendResponse);
      break;

    case 'UPDATE_SETTINGS':
      await handleUpdateSettings(request, sendResponse);
      break;

    case 'TEST_API':
      await handleTestAPI(request, sendResponse);
      break;

    case 'GET_USAGE_STATS':
      await handleGetUsageStats(sendResponse);
      break;

    case 'CLEAR_CACHE':
      await handleClearCache(sendResponse);
      break;

    case 'GET_TRANSLATION_STATUS':
      sendResponse({ enabled: isTranslationEnabled });
      break;

    case 'OCR_TRANSLATE_REQUEST':
      await handleOCRTranslateRequest(request, sendResponse);
      break;

    case 'ping':
      sendResponse({ pong: true, status: 'ok', timestamp: Date.now() });
      break;

    default:
      sendResponse({ error: '未知的消息类型' });
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({ error: error.message });
  }
}

/**
 * 处理翻译请求
 */
async function handleTranslateRequest(request, sendResponse) {
  if (!translationService) {
    await initializeTranslationService();
  }

  if (!translationService) {
    sendResponse({ error: '翻译服务未初始化' });
    return;
  }

  try {
    // 增强文本验证
    if (!request.text || typeof request.text !== 'string') {
      sendResponse({ error: '翻译文本格式无效' });
      return;
    }

    const trimmedText = request.text.trim();
    if (!trimmedText) {
      sendResponse({ error: '翻译文本不能为空' });
      return;
    }

    // 检查文本长度
    if (trimmedText.length < 2) {
      console.log('文本过短，跳过翻译:', trimmedText);
      sendResponse({ error: '文本过短，无需翻译' });
      return;
    }

    if (trimmedText.length > 5000) {
      sendResponse({ error: '翻译文本过长，请分段翻译' });
      return;
    }

    // 检查是否为纯数字或符号
    if (/^[\d\s\p{P}]*$/u.test(trimmedText)) {
      sendResponse({ error: '无需翻译纯数字或符号' });
      return;
    }

    const result = await translationService.translate(trimmedText, request.options || {});

    if (!result || !result.translatedText) {
      sendResponse({ error: '翻译服务返回空结果' });
      return;
    }

    sendResponse({ success: true, result });
  } catch (error) {
    console.error('翻译失败:', error.message);
    sendResponse({ error: error.message });
  }
}

/**
 * 处理切换翻译功能
 */
async function handleToggleTranslation(request, sendResponse) {
  const tabId = request.tabId || currentTabId;
  await toggleTranslation(tabId);
  sendResponse({ enabled: isTranslationEnabled });
}

/**
 * 处理获取设置
 */
async function handleGetSettings(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['yuying_settings']);
    sendResponse({ settings: result.yuying_settings || {} });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * 处理更新设置
 */
async function handleUpdateSettings(request, sendResponse) {
  try {
    await chrome.storage.sync.set({ yuying_settings: request.settings });

    // 更新翻译服务设置
    if (translationService) {
      await translationService.updateSettings(request.settings);
    }

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * 处理API测试
 */
async function handleTestAPI(request, sendResponse) {
  if (!translationService) {
    await initializeTranslationService();
  }

  try {
    const result = await translationService.testConnection(
      request.provider,
      request.apiKey
    );
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
      message: `测试失败: ${error.message}`
    });
  }
}

/**
 * 处理获取使用统计
 */
async function handleGetUsageStats(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['yuying_usage_stats']);
    const stats = result.yuying_usage_stats || { daily: {}, total: {} };

    // 获取缓存统计
    let cacheStats = {};
    if (translationService && translationService.cacheManager) {
      cacheStats = await translationService.cacheManager.getUsageReport();
    }

    sendResponse({
      usage: stats,
      cache: cacheStats
    });
  } catch (error) {
    console.error('获取使用统计失败:', error);
    // 返回默认数据结构而不是只返回error字段
    sendResponse({
      usage: { daily: {}, total: {} },
      cache: {},
      error: error.message
    });
  }
}

/**
 * 处理清空缓存
 */
async function handleClearCache(sendResponse) {
  try {
    if (translationService && translationService.cacheManager) {
      await translationService.cacheManager.clearAll();
    }
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

/**
 * 处理OCR翻译请求
 */
async function handleOCRTranslateRequest(request, sendResponse) {
  if (!translationService) {
    await initializeTranslationService();
  }

  if (!translationService) {
    sendResponse({ error: 'OCR翻译服务未初始化' });
    return;
  }

  try {
    // 验证请求参数
    if (!request.imageData) {
      sendResponse({ error: '图片数据不能为空' });
      return;
    }

    // 执行OCR翻译
    const result = await translationService.translateImage(request.imageData, request.options || {});
    sendResponse({ success: true, result });
  } catch (error) {
    console.error('OCR翻译失败:', error.message);
    sendResponse({ error: error.message });
  }
}

/**
 * 注入Content Script到指定标签页
 */
async function injectContentScript(tabId) {
  try {
    // 检查标签页是否存在且可访问
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || !tab.url) {
      console.log('标签页不存在或无效，跳过注入');
      return false;
    }

    // 检查是否为受限页面
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('file://') ||
        tab.url.startsWith('data:')) {
      console.log('跳过受限页面:', tab.url);
      return false;
    }

    // 检查标签页状态
    if (tab.status !== 'complete') {
      console.log('标签页未完全加载，等待加载完成');
      return false;
    }

    // 检查是否已经注入过
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return window.yuyingTranslatorInjected === true;
        }
      });

      if (results && results[0] && results[0].result) {
        console.log('Content script已存在，跳过重复注入');
        return true;
      }
    } catch (checkError) {
      // 如果检查失败，继续注入
      console.log('检查注入状态失败，继续注入:', checkError.message);
    }

    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/content.js']
    });
    console.log('Content script注入成功');
    return true;
  } catch (error) {
    // 更详细的错误处理
    if (error.message.includes('Cannot access a chrome:// URL')) {
      console.log('无法注入content script: Chrome内部页面不支持');
    } else if (error.message.includes('The tab was closed')) {
      console.log('无法注入content script: 标签页已关闭');
    } else if (error.message.includes('No tab with id')) {
      console.log('无法注入content script: 标签页不存在');
    } else if (error.message.includes('Cannot access contents of url')) {
      console.log('无法注入content script: 页面访问受限');
    } else {
      console.error('无法注入content script:', error.message);
    }
    return false;
  }
}

/**
 * 切换翻译功能
 */
async function toggleTranslation(tabId) {
  if (!tabId) return;

  currentTabId = tabId;
  isTranslationEnabled = !isTranslationEnabled;

  // 保存翻译状态到存储
  try {
    await chrome.storage.local.set({ yuying_translation_enabled: isTranslationEnabled });
  } catch (error) {
    console.error('保存翻译状态失败:', error);
  }

  // 更新扩展图标
  await updateExtensionIcon(isTranslationEnabled);

  // 通知content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'TRANSLATION_TOGGLED',
      enabled: isTranslationEnabled
    });
  } catch (error) {
    // 如果content script未加载，尝试注入它
    const injected = await injectContentScript(tabId);
    if (injected) {
      // 重新发送消息
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'TRANSLATION_TOGGLED',
            enabled: isTranslationEnabled
          });
        } catch (e) {
          console.error('无法与content script通信:', e.message);
        }
      }, 100);
    }
  }
}

/**
 * 处理翻译文本
 */
async function handleTranslateText(text, tabId) {
  if (!translationService) {
    await initializeTranslationService();
  }

  try {
    const result = await translationService.translate(text);

    // 发送翻译结果到content script
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_TRANSLATION',
      originalText: text,
      translatedText: result.translatedText,
      fromCache: result.fromCache
    });
  } catch (error) {
    console.error('翻译失败:', error);

    // 发送错误消息
    await chrome.tabs.sendMessage(tabId, {
      type: 'TRANSLATION_ERROR',
      error: error.message
    });
  }
}

/**
 * 更新扩展图标
 */
async function updateExtensionIcon(enabled) {
  const title = enabled ? '语影翻译 - 已激活' : '语影翻译 - 未激活';
  const badgeText = enabled ? 'ON' : '';
  const badgeColor = enabled ? '#28a745' : '#6c757d';

  try {
    // 设置标题
    await chrome.action.setTitle({ title });

    // 使用badge显示状态
    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor });

    console.log(`扩展状态已更新: ${enabled ? '激活' : '未激活'}`);
  } catch (error) {
    console.error('更新图标失败:', error);
  }
}

// 标签页更新监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    currentTabId = tabId;

    // 如果翻译功能已启用，通知新页面
    if (isTranslationEnabled) {
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'TRANSLATION_TOGGLED',
            enabled: true
          });
        } catch (error) {
          // 页面可能还没有加载content script
        }
      }, 1000);
    }
  }
});

// 标签页激活监听
chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId;
});

// 窗口焦点变化监听
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) {
        currentTabId = tab.id;
      }
    } catch (error) {
      // 忽略错误
    }
  }
});

// 定期清理缓存
setInterval(async () => {
  if (translationService && translationService.cacheManager) {
    try {
      const cache = await translationService.cacheManager.getCache();
      await translationService.cacheManager.cleanupCache(cache);
    } catch (error) {
      console.error('定期缓存清理失败:', error);
    }
  }
}, 60 * 60 * 1000); // 每小时清理一次

console.log('语影翻译插件 Background Script 已加载');
