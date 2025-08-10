/**
 * 语影翻译插件 - Popup Script
 * 处理设置面板的交互逻辑、API配置和用户界面
 */

// 全局变量
let currentSettings = {};
let isTestingAPI = false;

// DOM元素
let elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', init);

/**
 * 初始化popup
 */
async function init() {
  console.log('语影翻译插件 Popup 已加载');

  // 获取DOM元素
  initializeElements();

  // 加载设置
  await loadSettings();

  // 绑定事件
  bindEvents();

  // 更新UI状态
  updateUI();

  // 加载使用统计
  await loadUsageStats();
}

/**
 * 初始化DOM元素引用
 */
function initializeElements() {
  elements = {
    // 状态指示器
    statusIndicator: document.getElementById('status-indicator'),
    statusText: document.getElementById('status-text'),

    // 翻译功能开关
    enableToggle: document.getElementById('enable-toggle'),

    // API配置
    apiProvider: document.getElementById('api-provider'),
    apiKey: document.getElementById('api-key'),
    testApiBtn: document.getElementById('test-api'),
    apiStatus: document.getElementById('api-status'),

    // 翻译设置
    targetLanguage: document.getElementById('target-language'),
    autoTranslate: document.getElementById('auto-translate'),

    // 界面设置
    positionPreference: document.getElementById('position-preference'),
    fontSize: document.getElementById('font-size'),
    fontSizeValue: document.getElementById('font-size-value'),
    transparency: document.getElementById('transparency'),
    transparencyValue: document.getElementById('transparency-value'),

    // 使用统计
    todayTranslations: document.getElementById('today-translations'),
    totalTranslations: document.getElementById('total-translations'),
    totalCharacters: document.getElementById('total-characters'),
    cacheHitRate: document.getElementById('cache-hit-rate'),

    // 操作按钮 - 修复ID匹配问题
    saveBtn: document.getElementById('save-settings'),
    resetBtn: document.getElementById('reset-settings'),
    clearCacheBtn: document.getElementById('clear-cache')
  };

  // 检查关键元素是否存在
  const criticalElements = ['enableToggle', 'apiProvider', 'apiKey', 'testApiBtn', 'saveBtn', 'resetBtn', 'clearCacheBtn'];
  criticalElements.forEach(elementKey => {
    if (!elements[elementKey]) {
      console.error(`关键元素未找到: ${elementKey}`);
    }
  });
}

/**
 * 加载用户设置
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response && response.settings) {
      currentSettings = response.settings;
    } else {
      // 使用默认设置
      currentSettings = getDefaultSettings();
    }

    // 更新表单
    updateFormFromSettings();
  } catch (error) {
    console.error('加载设置失败:', error);
    showMessage('加载设置失败', 'error');
  }
}

/**
 * 获取默认设置
 */
function getDefaultSettings() {
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
 * 从设置更新表单
 */
function updateFormFromSettings() {
  if (elements.apiProvider) elements.apiProvider.value = currentSettings.apiProvider || 'deepseek';
  if (elements.apiKey) elements.apiKey.value = currentSettings.apiKey || '';
  if (elements.targetLanguage) elements.targetLanguage.value = currentSettings.targetLanguage || 'zh-CN';
  if (elements.autoTranslate) elements.autoTranslate.checked = currentSettings.autoTranslate || false;
  if (elements.positionPreference) elements.positionPreference.value = currentSettings.positionPreference || 'right';
  if (elements.fontSize) {
    elements.fontSize.value = currentSettings.fontSize || 14;
    if (elements.fontSizeValue) elements.fontSizeValue.textContent = `${currentSettings.fontSize || 14}px`;
  }
  if (elements.transparency) {
    // 透明度值统一处理：如果是小数形式(0.8)转换为百分比形式(80)
    let transparencyValue = currentSettings.transparency || 0.8;
    if (transparencyValue <= 1) {
      transparencyValue = transparencyValue * 100;
    }
    elements.transparency.value = transparencyValue;
    if (elements.transparencyValue) elements.transparencyValue.textContent = `${Math.round(transparencyValue)}%`;
  }
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 翻译功能开关
  if (elements.enableToggle) {
    elements.enableToggle.addEventListener('change', handleToggleTranslation);
  }

  // API提供商变化
  if (elements.apiProvider) {
    elements.apiProvider.addEventListener('change', handleProviderChange);
  }

  // API测试
  if (elements.testApiBtn) {
    elements.testApiBtn.addEventListener('click', handleTestAPI);
  }

  // 滑块值更新
  if (elements.fontSize) {
    elements.fontSize.addEventListener('input', (e) => {
      if (elements.fontSizeValue) {
        elements.fontSizeValue.textContent = `${e.target.value}px`;
      }
    });
  }

  if (elements.transparency) {
    elements.transparency.addEventListener('input', (e) => {
      if (elements.transparencyValue) {
        // 透明度滑块值范围是50-100，直接显示为百分比
        elements.transparencyValue.textContent = `${Math.round(e.target.value)}%`;
      }
    });
  }

  // 操作按钮
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', handleSaveSettings);
  }

  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', handleResetSettings);
  }

  if (elements.clearCacheBtn) {
    elements.clearCacheBtn.addEventListener('click', handleClearCache);
  }

  // 实时保存设置
  const formElements = document.querySelectorAll('input, select');
  formElements.forEach(element => {
    if (element.id !== 'api-key') { // API密钥需要手动保存
      element.addEventListener('change', debounce(autoSaveSettings, 500));
    }
  });
}

/**
 * 处理翻译功能开关
 */
async function handleToggleTranslation() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_TRANSLATION'
    });

    if (response) {
      updateTranslationStatus(response.enabled);
    }
  } catch (error) {
    console.error('切换翻译功能失败:', error);
    showMessage('切换翻译功能失败', 'error');
  }
}

/**
 * 处理API提供商变化
 */
function handleProviderChange() {
  const provider = elements.apiProvider.value;
  updateAPIKeyPlaceholder(provider);

  // 清除之前的API状态
  if (elements.apiStatus) {
    elements.apiStatus.textContent = '';
    elements.apiStatus.className = 'api-status';
  }
}

/**
 * 更新API密钥占位符
 */
function updateAPIKeyPlaceholder(provider) {
  const placeholders = {
    deepseek: '请输入DeepSeek API密钥',
    tongyi: '请输入通义千问API密钥',
    openai: '请输入OpenAI API密钥',
    gemini: '请输入Google Gemini API密钥',
    wenxin: '请输入百度文心一言API密钥'
  };

  if (elements.apiKey) {
    elements.apiKey.placeholder = placeholders[provider] || '请输入API密钥';
  }
}

/**
 * 处理API测试
 */
async function handleTestAPI() {
  if (isTestingAPI) return;

  const provider = elements.apiProvider.value;
  const apiKey = elements.apiKey.value.trim();

  if (!apiKey) {
    showMessage('请输入API密钥', 'error');
    return;
  }

  isTestingAPI = true;
  elements.testApiBtn.disabled = true;
  elements.testApiBtn.textContent = '测试中...';

  if (elements.apiStatus) {
    elements.apiStatus.textContent = '正在测试API连接...';
    elements.apiStatus.className = 'api-status testing';
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_API',
      provider: provider,
      apiKey: apiKey
    });

    if (response.success) {
      if (elements.apiStatus) {
        elements.apiStatus.textContent = '✓ API连接成功';
        elements.apiStatus.className = 'api-status success';
      }
      showMessage('API测试成功', 'success');
    } else {
      if (elements.apiStatus) {
        elements.apiStatus.textContent = `✗ ${response.message || 'API连接失败'}`;
        elements.apiStatus.className = 'api-status error';
      }
      showMessage(response.message || 'API测试失败', 'error');
    }
  } catch (error) {
    console.error('API测试失败:', error);
    if (elements.apiStatus) {
      elements.apiStatus.textContent = '✗ 测试失败';
      elements.apiStatus.className = 'api-status error';
    }
    showMessage('API测试失败', 'error');
  } finally {
    isTestingAPI = false;
    elements.testApiBtn.disabled = false;
    elements.testApiBtn.textContent = '测试连接';
  }
}

/**
 * 处理保存设置
 */
async function handleSaveSettings() {
  try {
    const newSettings = getSettingsFromForm();

    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });

    if (response.success) {
      currentSettings = newSettings;
      showMessage('设置已保存', 'success');
    } else {
      showMessage('保存设置失败', 'error');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    showMessage('保存设置失败', 'error');
  }
}

/**
 * 自动保存设置
 */
async function autoSaveSettings() {
  try {
    const newSettings = getSettingsFromForm();

    // 保留API密钥
    newSettings.apiKey = currentSettings.apiKey;

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });

    currentSettings = newSettings;
  } catch (error) {
    console.error('自动保存设置失败:', error);
  }
}

/**
 * 从表单获取设置
 */
function getSettingsFromForm() {
  // 透明度值处理：滑块值是50-100，需要转换为0.5-1.0
  let transparency = currentSettings.transparency;
  if (elements.transparency) {
    const sliderValue = parseFloat(elements.transparency.value);
    transparency = sliderValue / 100; // 转换为0-1之间的小数
  }

  return {
    apiKey: elements.apiKey ? elements.apiKey.value.trim() : currentSettings.apiKey,
    apiProvider: elements.apiProvider ? elements.apiProvider.value : currentSettings.apiProvider,
    targetLanguage: elements.targetLanguage ? elements.targetLanguage.value : currentSettings.targetLanguage,
    autoTranslate: elements.autoTranslate ? elements.autoTranslate.checked : currentSettings.autoTranslate,
    positionPreference: elements.positionPreference ? elements.positionPreference.value : currentSettings.positionPreference,
    fontSize: elements.fontSize ? parseInt(elements.fontSize.value) : currentSettings.fontSize,
    transparency: transparency,
    shortcuts: currentSettings.shortcuts || {
      toggle: 'Alt+T',
      settings: 'Alt+S'
    }
  };
}

/**
 * 处理重置设置
 */
async function handleResetSettings() {
  if (confirm('确定要重置所有设置吗？这将清除您的API密钥和自定义配置。')) {
    try {
      const defaultSettings = getDefaultSettings();

      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: defaultSettings
      });

      if (response.success) {
        currentSettings = defaultSettings;
        updateFormFromSettings();
        showMessage('设置已重置', 'success');

        // 清除API状态
        if (elements.apiStatus) {
          elements.apiStatus.textContent = '';
          elements.apiStatus.className = 'api-status';
        }
      } else {
        showMessage('重置设置失败', 'error');
      }
    } catch (error) {
      console.error('重置设置失败:', error);
      showMessage('重置设置失败', 'error');
    }
  }
}

/**
 * 处理清空缓存
 */
async function handleClearCache() {
  if (confirm('确定要清空翻译缓存吗？这将删除所有已缓存的翻译结果。')) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_CACHE'
      });

      if (response.success) {
        showMessage('缓存已清空', 'success');
        await loadUsageStats(); // 重新加载统计信息
      } else {
        showMessage('清空缓存失败', 'error');
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
      showMessage('清空缓存失败', 'error');
    }
  }
}

/**
 * 加载使用统计
 */
async function loadUsageStats() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_USAGE_STATS'
    });

    if (response) {
      updateUsageStats(response.usage, response.cache);
    }
  } catch (error) {
    console.error('加载使用统计失败:', error);
  }
}

/**
 * 更新使用统计显示
 */
function updateUsageStats(usage, cache) {
  // 添加usage参数的空值检查
  if (!usage) {
    usage = { daily: {}, total: {} };
  }

  const today = new Date().toISOString().split('T')[0];

  // 今日翻译次数
  const todayCount = usage.daily && usage.daily[today] ? usage.daily[today].count : 0;
  if (elements.todayTranslations) {
    elements.todayTranslations.textContent = todayCount;
  }

  // 总翻译次数
  const totalCount = usage.total ? usage.total.count : 0;
  if (elements.totalTranslations) {
    elements.totalTranslations.textContent = totalCount;
  }

  // 总字符数
  const totalChars = usage.total ? usage.total.characters : 0;
  if (elements.totalCharacters) {
    elements.totalCharacters.textContent = totalChars;
  }

  // 缓存命中率
  const hitRate = cache && cache.hitRate ? Math.round(cache.hitRate * 100) : 0;
  if (elements.cacheHitRate) {
    elements.cacheHitRate.textContent = `${hitRate}%`;
  }
}

/**
 * 更新UI状态
 */
function updateUI() {
  // 更新API密钥占位符
  updateAPIKeyPlaceholder(currentSettings.apiProvider || 'deepseek');

  // 检查翻译状态
  checkTranslationStatus();
}

/**
 * 检查翻译状态
 */
async function checkTranslationStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_TRANSLATION_STATUS'
    });

    if (response) {
      updateTranslationStatus(response.enabled);
    }
  } catch (error) {
    console.error('检查翻译状态失败:', error);
  }
}

/**
 * 更新翻译状态显示
 */
function updateTranslationStatus(enabled) {
  if (elements.enableToggle) {
    elements.enableToggle.checked = enabled;
  }

  if (elements.statusIndicator) {
    elements.statusIndicator.className = `status-indicator ${enabled ? 'active' : 'inactive'}`;
  }

  if (elements.statusText) {
    elements.statusText.textContent = enabled ? '已激活' : '未激活';
  }
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;

  // 添加到页面
  document.body.appendChild(messageEl);

  // 自动移除
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

console.log('语影翻译插件 Popup Script 已加载');
