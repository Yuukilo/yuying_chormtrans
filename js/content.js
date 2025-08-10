/**
 * 语影翻译插件 - Content Script
 * 处理网页内容的翻译交互、文本选择和浮动框显示
 */

// 全局变量
let isTranslationEnabled = false;
let translationFloatingBox = null;
let selectedText = '';
let selectionRange = null;
let settings = {};
let isMouseDown = false;
let selectionTimeout = null;
let ocrTranslator = null;
let observer = null;
let isProcessing = false;
let connectionRetryCount = 0;
const MAX_RETRY_COUNT = 3;
let scrollTimeout;

/**
 * 初始化content script
 */
function init() {
  console.log('语影翻译插件 Content Script 已加载');

  // 加载设置
  loadSettings();

  // 添加事件监听器
  addEventListeners();

  // 创建样式
  injectStyles();

  // 监听来自background的消息
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * 加载用户设置
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response && response.settings) {
      settings = response.settings;
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

/**
 * 添加事件监听器
 */
function addEventListeners() {
  // 鼠标事件
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);

  // 选择事件
  document.addEventListener('selectionchange', handleSelectionChange);

  // 键盘事件
  document.addEventListener('keydown', handleKeyDown);

  // 点击事件（隐藏浮动框）
  document.addEventListener('click', handleDocumentClick);

  // 滚动事件（更新浮动框位置）
  document.addEventListener('scroll', handleScroll, true);

  // 窗口大小变化
  window.addEventListener('resize', handleResize);
}

/**
 * 处理鼠标按下事件
 */
function handleMouseDown(_event) {
  isMouseDown = true;

  // 如果点击的不是浮动框，隐藏它
  if (translationFloatingBox && !translationFloatingBox.contains(_event.target)) {
    hideFloatingBox();
  }
}

/**
 * 处理鼠标释放事件
 */
function handleMouseUp(_event) {
  isMouseDown = false;

  // 延迟检查选择，确保选择已完成
  setTimeout(() => {
    checkSelection();
  }, 10);
}

/**
 * 处理鼠标移动事件
 */
function handleMouseMove(event) {
  // 如果正在选择文本，更新浮动框位置
  if (isMouseDown && translationFloatingBox) {
    updateFloatingBoxPosition(event.clientX, event.clientY);
  }
}

/**
 * 处理选择变化事件
 */
function handleSelectionChange() {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  selectionTimeout = setTimeout(() => {
    checkSelection();
  }, 100);
}

/**
 * 检查文本选择
 */
function checkSelection() {
  if (!isTranslationEnabled) return;

  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text && text.length > 0 && text.length < 5000) {
    selectedText = text;
    selectionRange = selection.getRangeAt(0);

    // 显示翻译按钮或自动翻译
    if (settings.autoTranslate) {
      translateSelectedText();
    } else {
      showTranslationButton();
    }
  } else {
    hideFloatingBox();
  }
}

/**
 * 处理键盘事件
 */
function handleKeyDown(event) {
  // Esc键隐藏浮动框
  if (event.key === 'Escape') {
    hideFloatingBox();
  }

  // 快捷键翻译
  if (event.altKey && event.key === 't') {
    event.preventDefault();
    if (selectedText) {
      translateSelectedText();
    }
  }
}

/**
 * 处理文档点击事件
 */
function handleDocumentClick(event) {
  // 如果点击的不是浮动框，隐藏它
  if (translationFloatingBox && !translationFloatingBox.contains(event.target)) {
    hideFloatingBox();
  }
}

/**
 * 处理滚动事件
 */
function handleScroll() {
  if (translationFloatingBox && selectionRange) {
    updateFloatingBoxPositionFromRange();
  }
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (translationFloatingBox && selectionRange) {
    updateFloatingBoxPositionFromRange();
  }
}

/**
 * 处理来自background的消息
 */
function handleMessage(request, sender, sendResponse) {
  switch (request.type) {
  case 'TRANSLATION_TOGGLED':
    isTranslationEnabled = request.enabled;
    if (!isTranslationEnabled) {
      hideFloatingBox();
      clearPageTranslations();
      stopTranslation();
    } else {
      startTranslation();
    }
    sendResponse({ success: true });
    break;

  case 'SHOW_TRANSLATION':
    showTranslationResult(request.originalText, request.translatedText, request.fromCache);
    sendResponse({ success: true });
    break;

  case 'TRANSLATION_ERROR':
    showTranslationError(request.error);
    sendResponse({ success: true });
    break;

  default:
    sendResponse({ error: '未知的消息类型' });
  }
}

/**
 * 显示翻译按钮
 */
function showTranslationButton() {
  if (!selectionRange) return;

  hideFloatingBox();

  translationFloatingBox = createFloatingBox('button');

  const button = document.createElement('button');
  button.className = 'yuying-translate-btn';
  button.innerHTML = '🌐 翻译';
  button.onclick = translateSelectedText;

  translationFloatingBox.appendChild(button);
  document.body.appendChild(translationFloatingBox);

  updateFloatingBoxPositionFromRange();
}

/**
 * 翻译选中的文本
 */
async function translateSelectedText() {
  if (!selectedText) return;

  // 显示加载状态
  showLoadingState();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_REQUEST',
      text: selectedText,
      options: {
        targetLanguage: settings.targetLanguage || 'zh-CN'
      }
    });

    if (response.success) {
      showTranslationResult(selectedText, response.result.translatedText, response.result.fromCache);
    } else {
      showTranslationError(response.error || '翻译失败');
    }
  } catch (error) {
    console.error('翻译请求失败:', error);
    showTranslationError('翻译请求失败');
  }
}

/**
 * 显示加载状态
 */
function showLoadingState() {
  hideFloatingBox();

  translationFloatingBox = createFloatingBox('loading');

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'yuying-loading';
  loadingDiv.innerHTML = `
    <div class="yuying-spinner"></div>
    <span>翻译中...</span>
  `;

  translationFloatingBox.appendChild(loadingDiv);
  document.body.appendChild(translationFloatingBox);

  updateFloatingBoxPositionFromRange();
}

/**
 * 显示翻译结果
 */
function showTranslationResult(originalText, translatedText, fromCache) {
  hideFloatingBox();

  translationFloatingBox = createFloatingBox('result');

  const resultDiv = document.createElement('div');
  resultDiv.className = 'yuying-result';

  const header = document.createElement('div');
  header.className = 'yuying-result-header';
  header.innerHTML = `
    <span class="yuying-title">语影翻译</span>
    ${fromCache ? '<span class="yuying-cache-indicator">缓存</span>' : ''}
    <button class="yuying-close-btn" onclick="this.closest('.yuying-floating-box').remove()">&times;</button>
  `;

  const content = document.createElement('div');
  content.className = 'yuying-result-content';

  const originalDiv = document.createElement('div');
  originalDiv.className = 'yuying-original';
  originalDiv.innerHTML = `<strong>原文:</strong><br>${escapeHtml(originalText)}`;

  const translatedDiv = document.createElement('div');
  translatedDiv.className = 'yuying-translated';
  translatedDiv.innerHTML = `<strong>译文:</strong><br>${escapeHtml(translatedText)}`;

  const actions = document.createElement('div');
  actions.className = 'yuying-actions';
  actions.innerHTML = `
    <button class="yuying-copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(translatedText)}').then(() => this.textContent = '已复制!')">复制译文</button>
    <button class="yuying-retry-btn" onclick="window.yuyingRetryTranslation()">重新翻译</button>
  `;

  content.appendChild(originalDiv);
  content.appendChild(translatedDiv);
  content.appendChild(actions);

  resultDiv.appendChild(header);
  resultDiv.appendChild(content);
  translationFloatingBox.appendChild(resultDiv);

  document.body.appendChild(translationFloatingBox);

  updateFloatingBoxPositionFromRange();

  // 添加重新翻译功能
  window.yuyingRetryTranslation = () => {
    translateSelectedText();
  };
}

/**
 * 显示翻译错误
 */
function showTranslationError(error) {
  hideFloatingBox();

  translationFloatingBox = createFloatingBox('error');

  const errorDiv = document.createElement('div');
  errorDiv.className = 'yuying-error';
  errorDiv.innerHTML = `
    <div class="yuying-error-header">
      <span class="yuying-title">翻译失败</span>
      <button class="yuying-close-btn" onclick="this.closest('.yuying-floating-box').remove()">&times;</button>
    </div>
    <div class="yuying-error-content">
      <p>${escapeHtml(error)}</p>
      <button class="yuying-retry-btn" onclick="window.yuyingRetryTranslation()">重试</button>
    </div>
  `;

  translationFloatingBox.appendChild(errorDiv);
  document.body.appendChild(translationFloatingBox);

  updateFloatingBoxPositionFromRange();

  // 添加重试功能
  window.yuyingRetryTranslation = () => {
    translateSelectedText();
  };
}

/**
 * 创建浮动框
 */
function createFloatingBox(type) {
  const box = document.createElement('div');
  box.className = `yuying-floating-box yuying-${type}`;

  // 修复透明度计算：如果值大于1，说明是百分比形式，需要除以100
  let opacity = settings.transparency || 0.8;
  if (opacity > 1) {
    opacity = opacity / 100;
  }

  box.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: ${settings.fontSize || 14}px;
    opacity: ${opacity};
    max-width: 400px;
    min-width: 200px;
  `;

  return box;
}

/**
 * 更新浮动框位置（基于选择范围）
 */
function updateFloatingBoxPositionFromRange() {
  if (!translationFloatingBox || !selectionRange) return;

  const rect = selectionRange.getBoundingClientRect();
  const boxRect = translationFloatingBox.getBoundingClientRect();

  let left = rect.left + (rect.width / 2) - (boxRect.width / 2);
  let top = rect.bottom + 10;

  // 确保浮动框在视窗内
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < 10) left = 10;
  if (left + boxRect.width > viewportWidth - 10) {
    left = viewportWidth - boxRect.width - 10;
  }

  if (top + boxRect.height > viewportHeight - 10) {
    top = rect.top - boxRect.height - 10;
  }

  if (top < 10) top = 10;

  translationFloatingBox.style.left = `${left}px`;
  translationFloatingBox.style.top = `${top}px`;
}

/**
 * 更新浮动框位置（基于鼠标位置）
 */
function updateFloatingBoxPosition(mouseX, mouseY) {
  if (!translationFloatingBox) return;

  const boxRect = translationFloatingBox.getBoundingClientRect();

  let left = mouseX - (boxRect.width / 2);
  let top = mouseY + 20;

  // 确保浮动框在视窗内
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < 10) left = 10;
  if (left + boxRect.width > viewportWidth - 10) {
    left = viewportWidth - boxRect.width - 10;
  }

  if (top + boxRect.height > viewportHeight - 10) {
    top = mouseY - boxRect.height - 20;
  }

  if (top < 10) top = 10;

  translationFloatingBox.style.left = `${left}px`;
  translationFloatingBox.style.top = `${top}px`;
}

/**
 * 隐藏浮动框
 */
function hideFloatingBox() {
  if (translationFloatingBox) {
    translationFloatingBox.remove();
    translationFloatingBox = null;
  }

  selectedText = '';
  selectionRange = null;
}

/**
 * 转义HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 注入样式
 */
function injectStyles() {
  if (document.getElementById('yuying-styles')) return;

  const style = document.createElement('style');
  style.id = 'yuying-styles';
  style.textContent = `
    .yuying-floating-box {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      line-height: 1.5 !important;
      color: #333 !important;
      background: white !important;
      border: 1px solid #ddd !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }
    
    .yuying-translate-btn {
      background: #4285f4 !important;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      transition: background-color 0.2s !important;
      margin: 8px !important;
      display: block !important;
    }
    
    .yuying-translate-btn:hover {
      background: #3367d6 !important;
    }
    
    .yuying-loading {
      padding: 16px !important;
      text-align: center !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .yuying-spinner {
      width: 16px !important;
      height: 16px !important;
      border: 2px solid #f3f3f3 !important;
      border-top: 2px solid #4285f4 !important;
      border-radius: 50% !important;
      animation: yuying-spin 1s linear infinite !important;
    }
    
    @keyframes yuying-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .yuying-result-header, .yuying-error-header {
      background: #f8f9fa !important;
      padding: 12px 16px !important;
      border-bottom: 1px solid #e9ecef !important;
      border-radius: 8px 8px 0 0 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    
    .yuying-title {
      font-weight: 600 !important;
      color: #333 !important;
      font-size: 14px !important;
    }
    
    .yuying-cache-indicator {
      background: #28a745 !important;
      color: white !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
    }
    
    .yuying-close-btn {
      background: none !important;
      border: none !important;
      font-size: 18px !important;
      cursor: pointer !important;
      color: #666 !important;
      padding: 0 !important;
      width: 24px !important;
      height: 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 4px !important;
    }
    
    .yuying-close-btn:hover {
      background: #f0f0f0 !important;
      color: #333 !important;
    }
    
    .yuying-result-content, .yuying-error-content {
      padding: 16px !important;
    }
    
    .yuying-original, .yuying-translated {
      margin-bottom: 12px !important;
      padding: 8px !important;
      background: #f8f9fa !important;
      border-radius: 4px !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
    }
    
    .yuying-translated {
      background: #e8f5e8 !important;
    }
    
    .yuying-actions {
      display: flex !important;
      gap: 8px !important;
      margin-top: 12px !important;
    }
    
    .yuying-copy-btn, .yuying-retry-btn {
      background: #6c757d !important;
      color: white !important;
      border: none !important;
      padding: 6px 12px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      transition: background-color 0.2s !important;
    }
    
    .yuying-copy-btn:hover {
      background: #5a6268 !important;
    }
    
    .yuying-retry-btn {
      background: #007bff !important;
    }
    
    .yuying-retry-btn:hover {
      background: #0056b3 !important;
    }
    
    .yuying-error {
      color: #721c24 !important;
    }
    
    .yuying-error-header {
      background: #f8d7da !important;
      border-bottom-color: #f1aeb5 !important;
    }
    
    .yuying-error-content p {
      margin: 0 0 12px 0 !important;
      color: #721c24 !important;
    }
  `;

  document.head.appendChild(style);
}

/**
 * 翻译页面可见内容
 */
function translateVisibleContent() {
  if (!isTranslationEnabled || !settings.autoTranslate) return;

  console.log('开始翻译页面可见内容...');

  // 获取页面中的文本节点
  const textNodes = getVisibleTextNodes();
  console.log(`找到 ${textNodes.length} 个可见文本节点`);

  // 按可见性和位置优先级排序
  const prioritizedNodes = prioritizeNodesByVisibility(textNodes);

  // 批量翻译文本节点
  translateTextNodes(prioritizedNodes);
}

/**
 * 优先翻译可见区域内容
 */
function translateVisibleContentWithPriority() {
  if (!isTranslationEnabled || !settings.autoTranslate) return;

  console.log('开始优先翻译可见区域内容...');

  // 获取页面中的文本节点
  const textNodes = getVisibleTextNodes();
  console.log(`找到 ${textNodes.length} 个可见文本节点`);

  // 按可见性和位置优先级排序，优先处理视口内容
  const prioritizedNodes = prioritizeNodesByViewportVisibility(textNodes);

  // 批量翻译文本节点，采用更激进的优先级策略
  translateTextNodesWithPriority(prioritizedNodes);
}

/**
 * 按可见性和位置优先级排序节点
 */
function prioritizeNodesByVisibility(textNodes) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  return textNodes
    .map(node => {
      const element = node.parentElement;
      const rect = element.getBoundingClientRect();

      // 计算节点在视口中的可见度
      const visibleArea = calculateVisibleArea(rect, viewportWidth, viewportHeight);

      // 计算距离视口顶部的距离（用于排序）
      const distanceFromTop = Math.max(0, rect.top);

      return {
        node,
        rect,
        visibleArea,
        distanceFromTop,
        isInViewport: rect.bottom > 0 && rect.top < viewportHeight && rect.right > 0 && rect.left < viewportWidth
      };
    })
    .sort((a, b) => {
      // 优先级1: 视口内的内容优先
      if (a.isInViewport && !b.isInViewport) return -1;
      if (!a.isInViewport && b.isInViewport) return 1;

      // 优先级2: 可见面积大的优先
      if (a.isInViewport && b.isInViewport) {
        const areaDiff = b.visibleArea - a.visibleArea;
        if (Math.abs(areaDiff) > 1000) return areaDiff > 0 ? 1 : -1;
      }

      // 优先级3: 距离顶部近的优先
      return a.distanceFromTop - b.distanceFromTop;
    })
    .map(item => item.node);
}

/**
 * 按视口可见性优先级排序节点（更激进的优先级策略）
 */
function prioritizeNodesByViewportVisibility(textNodes) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  return textNodes
    .map(node => {
      const element = node.parentElement;
      if (!element) return { node, priority: 999999, isInViewport: false };

      const rect = element.getBoundingClientRect();

      // 计算节点在视口中的可见度
      const visibleArea = calculateVisibleArea(rect, viewportWidth, viewportHeight);
      const totalArea = rect.width * rect.height;
      const visibilityRatio = totalArea > 0 ? visibleArea / totalArea : 0;

      // 判断是否在视口内
      const isInViewport = rect.bottom > 0 && rect.top < viewportHeight &&
                          rect.right > 0 && rect.left < viewportWidth;

      // 计算优先级分数（越小优先级越高）
      let priority = 0;

      if (isInViewport) {
        // 视口内元素：基于可见面积和位置计算优先级
        priority = 100 - (visibilityRatio * 50) - Math.min(50, (viewportHeight - rect.top) / viewportHeight * 50);

        // 考虑文本长度，较长的文本优先级更高
        const textLength = node.textContent.trim().length;
        if (textLength > 100) priority -= 10;
        else if (textLength > 50) priority -= 5;

        // 考虑元素类型，标题等重要元素优先级更高
        const tagName = element.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) priority -= 20;
        else if (['p', 'div', 'span'].includes(tagName)) priority -= 5;

      } else {
        // 视口外元素：基于距离视口的远近
        if (rect.bottom <= 0) {
          // 视口上方
          priority = 1000 + Math.abs(rect.bottom);
        } else if (rect.top >= viewportHeight) {
          // 视口下方
          priority = 2000 + (rect.top - viewportHeight);
        } else {
          // 视口左右两侧
          priority = 3000 + Math.min(Math.abs(rect.left), Math.abs(rect.right - viewportWidth));
        }
      }

      return {
        node,
        priority,
        isInViewport,
        visibilityRatio
      };
    })
    .sort((a, b) => a.priority - b.priority)
    .map(item => item.node);
}

/**
 * 计算元素在视口中的可见面积
 */
function calculateVisibleArea(rect, viewportWidth, viewportHeight) {
  const visibleLeft = Math.max(0, rect.left);
  const visibleTop = Math.max(0, rect.top);
  const visibleRight = Math.min(viewportWidth, rect.right);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);

  const visibleWidth = Math.max(0, visibleRight - visibleLeft);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  return visibleWidth * visibleHeight;
}

/**
 * 获取页面中可见的文本节点
 */
function getVisibleTextNodes() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 过滤掉脚本、样式等不需要翻译的内容
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'textarea', 'input', 'select'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // 过滤掉已翻译的内容
        if (parent.classList.contains('yuying-translated-text') ||
            parent.classList.contains('yuying-translation-wrapper') ||
            parent.closest('.yuying-translated-text') ||
            parent.closest('.yuying-translation-wrapper')) {
          return NodeFilter.FILTER_REJECT;
        }

        // 检查文本内容是否适合翻译
        if (!isTextSuitableForTranslation(node.textContent)) {
          return NodeFilter.FILTER_REJECT;
        }

        // 检查元素是否可见（增强版）
        if (!isElementVisibleEnhanced(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

/**
 * 检查文本是否适合翻译
 */
function isTextSuitableForTranslation(text) {
  const trimmedText = text.trim();

  // 长度检查
  if (trimmedText.length < 2 || trimmedText.length > 1000) {
    return false;
  }

  // 排除纯数字、纯符号
  if (/^[\d\s+.,()\\\\[\]{}-]+$/.test(trimmedText)) {
    return false;
  }

  // 排除单个字符（除非是中文、日文、韩文）
  if (trimmedText.length === 1 && !/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(trimmedText)) {
    return false;
  }

  // 排除常见的UI元素文本
  const uiTexts = ['×', '•', '...', '→', '←', '↑', '↓', '▲', '▼', '◀', '▶', '★', '☆', '♠', '♥', '♦', '♣'];
  if (uiTexts.includes(trimmedText)) {
    return false;
  }

  // 排除看起来像代码的文本
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[({[]/.test(trimmedText) ||
      /^[\w-]+\.[\w-]+/.test(trimmedText)) {
    return false;
  }

  // 排除纯空白字符
  if (/^[\s\p{P}]*$/u.test(trimmedText)) {
    return false;
  }

  return true;
}

/**
 * 检查元素是否可见（增强版，专门处理艺术字体）
 */
function isElementVisibleEnhanced(element) {
  const style = window.getComputedStyle(element);

  // 基本可见性检查
  if (style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity) === 0) {
    return false;
  }

  // 检查元素尺寸
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  // 检查字体大小（处理艺术字体）
  const fontSize = parseFloat(style.fontSize);
  if (fontSize < 6) { // 字体太小可能是装饰性文字
    return false;
  }

  // 检查文字颜色与背景色对比度（处理隐藏文字）
  const textColor = style.color;
  const backgroundColor = style.backgroundColor;
  if (textColor === backgroundColor && textColor !== 'rgba(0, 0, 0, 0)') {
    return false;
  }

  // 检查是否被其他元素遮挡（针对艺术字体的特殊处理）
  try {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 确保坐标在视口内
    if (centerX < 0 || centerY < 0 || centerX > window.innerWidth || centerY > window.innerHeight) {
      return true; // 在视口外的元素暂时认为可见
    }

    const elementAtPoint = document.elementFromPoint(centerX, centerY);

    // 如果点击位置的元素是当前元素或其子元素，则认为可见
    if (elementAtPoint && (elementAtPoint === element || element.contains(elementAtPoint))) {
      return true;
    }

    // 对于艺术字体，可能有特殊的层叠结构
    if (elementAtPoint && elementAtPoint.closest) {
      const closestContainer = elementAtPoint.closest('[class*="text"], [class*="title"], [class*="heading"], [class*="content"], [class*="label"], [class*="caption"]');
      if (closestContainer && (closestContainer === element || closestContainer.contains(element))) {
        return true;
      }
    }

    // 检查是否是艺术字体的特殊情况
    const fontFamily = style.fontFamily.toLowerCase();
    const isArtisticFont = /serif|script|display|decorative|fantasy/.test(fontFamily) ||
                          /italic|oblique/.test(style.fontStyle) ||
                          parseInt(style.fontWeight) >= 600;

    if (isArtisticFont) {
      // 对艺术字体更宽松的可见性判断
      return rect.width > 10 && rect.height > 10;
    }
  } catch (e) {
    // 如果检查失败，默认认为可见
    return true;
  }

  return true;
}


/**
 * 批量翻译文本节点
 */
async function translateTextNodes(textNodes) {
  if (textNodes.length === 0) return;

  console.log(`开始批量翻译 ${textNodes.length} 个节点`);

  // 分离视口内和视口外的节点
  const { viewportNodes, outsideNodes } = separateNodesByViewport(textNodes);

  console.log(`视口内节点: ${viewportNodes.length}, 视口外节点: ${outsideNodes.length}`);

  // 优先翻译视口内的节点
  if (viewportNodes.length > 0) {
    await translateNodesBatch(viewportNodes, 'viewport', 2, 100); // 小批次，快速处理
  }

  // 延迟翻译视口外的节点
  if (outsideNodes.length > 0) {
    setTimeout(async () => {
      console.log('开始翻译视口外内容');
      await translateNodesBatch(outsideNodes, 'outside', 5, 300); // 大批次，慢速处理
    }, 500);
  }
}

/**
 * 优先级批量翻译文本节点（更激进的策略）
 */
async function translateTextNodesWithPriority(textNodes) {
  if (textNodes.length === 0) return;

  console.log(`开始优先级批量翻译 ${textNodes.length} 个节点`);

  // 分离视口内和视口外的节点
  const { viewportNodes, outsideNodes } = separateNodesByViewport(textNodes);

  console.log(`视口内节点: ${viewportNodes.length}, 视口外节点: ${outsideNodes.length}`);

  // 立即翻译视口内的节点，使用更小的批次和更短的延迟
  if (viewportNodes.length > 0) {
    await translateNodesBatch(viewportNodes, 'viewport-priority', 1, 50); // 单个处理，极速响应
  }

  // 更长延迟后翻译视口外的节点
  if (outsideNodes.length > 0) {
    setTimeout(async () => {
      console.log('开始翻译视口外内容（低优先级）');
      await translateNodesBatch(outsideNodes, 'outside-low-priority', 8, 500); // 更大批次，更慢处理
    }, 1000);
  }
}

/**
 * 分离视口内外的节点
 */
function separateNodesByViewport(textNodes) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const viewportNodes = [];
  const outsideNodes = [];

  textNodes.forEach(node => {
    if (!node.parentElement) {
      outsideNodes.push(node);
      return;
    }

    const rect = node.parentElement.getBoundingClientRect();
    const isInViewport = rect.bottom > 0 && rect.top < viewportHeight &&
                        rect.right > 0 && rect.left < viewportWidth;

    if (isInViewport) {
      viewportNodes.push(node);
    } else {
      outsideNodes.push(node);
    }
  });

  return { viewportNodes, outsideNodes };
}

/**
 * 批量翻译节点
 */
async function translateNodesBatch(nodes, type, batchSize, delay) {
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);

    console.log(`翻译${type}内容批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(nodes.length/batchSize)}: ${batch.length} 个节点`);

    // 并行处理当前批次
    const promises = batch.map(node => translateTextNode(node));

    try {
      await Promise.all(promises);
      // 批次间延迟
      if (i + batchSize < nodes.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`${type}内容批量翻译失败:`, error);
    }
  }

  console.log(`${type}内容翻译完成`);
}

/**
 * 翻译单个文本节点
 */
async function translateTextNode(textNode) {
  // 增强null检查
  if (!textNode || !textNode.textContent || !textNode.parentNode) {
    console.log('文本节点无效，跳过翻译');
    return;
  }

  const originalText = textNode.textContent.trim();
  if (!originalText || originalText.length < 10) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_REQUEST',
      text: originalText,
      options: {
        targetLanguage: settings.targetLanguage || 'zh-CN'
      }
    });

    // 再次检查节点是否仍然有效
    if (!textNode.parentNode || !document.contains(textNode)) {
      console.log('文本节点在翻译过程中被移除，跳过处理');
      return;
    }

    if (response && response.success && response.result && response.result.translatedText) {
      // 创建包装容器
      const wrapperElement = document.createElement('div');
      wrapperElement.className = 'yuying-translation-wrapper';
      wrapperElement.style.cssText = `
        display: inline-block !important;
        position: relative !important;
        margin: 2px 0 !important;
        padding: 4px !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 4px !important;
        background: rgba(248, 249, 250, 0.8) !important;
        line-height: 1.4 !important;
      `;

      // 创建原文元素
      const originalElement = document.createElement('div');
      originalElement.className = 'yuying-original-text';
      originalElement.textContent = originalText;
      originalElement.style.cssText = `
        display: block !important;
        font-size: 0.9em !important;
        color: #666 !important;
        margin-bottom: 2px !important;
        padding: 2px 4px !important;
        background-color: rgba(173, 216, 230, 0.2) !important;
        border-radius: 2px !important;
        border-left: 3px solid #87CEEB !important;
      `;

      // 创建翻译结果元素
      const translatedElement = document.createElement('div');
      translatedElement.className = 'yuying-translated-text';
      translatedElement.textContent = response.result.translatedText;
      translatedElement.style.cssText = `
        display: block !important;
        background-color: rgba(144, 238, 144, 0.3) !important;
        color: #006400 !important;
        font-size: 1em !important;
        font-weight: 500 !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        border-left: 3px solid #32CD32 !important;
        cursor: help !important;
      `;

      // 添加悬停效果
      translatedElement.title = `翻译结果: ${response.result.translatedText}`;
      originalElement.title = `原文: ${originalText}`;

      // 组装元素 - 上下排列显示
      wrapperElement.appendChild(originalElement);
      wrapperElement.appendChild(translatedElement);

      // 最终检查并替换原文本节点
      if (textNode.parentNode && textNode.parentNode.contains && textNode.parentNode.contains(textNode)) {
        try {
          textNode.parentNode.replaceChild(wrapperElement, textNode);
        } catch (domError) {
          console.error('DOM操作失败:', domError.message);
          // 如果替换失败，尝试插入到父节点
          try {
            if (textNode.parentNode && textNode.parentNode.insertBefore && textNode.parentNode.removeChild) {
              textNode.parentNode.insertBefore(wrapperElement, textNode);
              textNode.parentNode.removeChild(textNode);
            }
          } catch (fallbackError) {
            console.error('DOM操作备用方案也失败:', fallbackError.message);
          }
        }
      } else {
        console.log('文本节点已从DOM中移除，跳过翻译');
      }
    }
  } catch (error) {
    console.error('翻译文本节点失败:', error);
    // 增加连接重试机制
    if (error.message && error.message.includes('Extension context invalidated')) {
      connectionRetryCount++;
      if (connectionRetryCount < MAX_RETRY_COUNT) {
        console.log(`尝试重新连接 (${connectionRetryCount}/${MAX_RETRY_COUNT})`);
        setTimeout(() => translateTextNode(textNode), 1000 * connectionRetryCount);
      }
    }
  }
}

/**
 * 清除页面翻译
 */
function clearPageTranslations() {
  const translatedElements = document.querySelectorAll('.yuying-translated-text');
  translatedElements.forEach(element => {
    const originalText = element.title.replace('原文: ', '');
    const textNode = document.createTextNode(originalText);
    element.parentNode.replaceChild(textNode, element);
  });
}

/**
 * 监听滚动事件，翻译新出现的内容
 */
function handlePageScroll() {
  if (!isTranslationEnabled || !settings.autoTranslate) return;

  // 防抖处理
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    translateVisibleContent();
  }, 1000);
}

// 添加滚动监听
document.addEventListener('scroll', handlePageScroll, { passive: true });

/**
 * 启动翻译功能
 */
function startTranslation() {
  if (isTranslationEnabled) return;

  isTranslationEnabled = true;
  console.log('启动翻译功能');

  // 开始监听页面变化
  startObserver();

  // 启动OCR翻译功能
  if (ocrTranslator) {
    try {
      ocrTranslator.init();
      // 翻译页面中的图片
      setTimeout(() => {
        if (ocrTranslator && typeof ocrTranslator.translatePageImages === 'function') {
          ocrTranslator.translatePageImages();
        }
      }, 1000);
    } catch (error) {
      console.error('OCR翻译器初始化失败:', error);
    }
  } else if (window.OCRTranslator) {
    try {
      ocrTranslator = new window.OCRTranslator();
      ocrTranslator.init();
      // 翻译页面中的图片
      setTimeout(() => {
        if (ocrTranslator && typeof ocrTranslator.translatePageImages === 'function') {
          ocrTranslator.translatePageImages();
        }
      }, 1000);
    } catch (error) {
      console.error('OCR翻译器创建失败:', error);
    }
  }

  // 翻译当前页面，优先处理可见区域
  if (settings.autoTranslate) {
    translateVisibleContentWithPriority();
  }
}

/**
 * 停止翻译功能
 */
function stopTranslation() {
  if (!isTranslationEnabled) return;

  isTranslationEnabled = false;
  console.log('停止翻译功能');

  // 停止监听页面变化
  stopObserver();

  // 停止OCR翻译功能
  if (ocrTranslator) {
    try {
      ocrTranslator.destroy();
    } catch (error) {
      console.error('OCR翻译器销毁失败:', error);
    }
  }

  // 清除页面翻译
  clearPageTranslations();
}

/**
 * 开始监听页面变化
 */
function startObserver() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    if (isProcessing) return;

    let hasNewContent = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasNewContent = true;
      }
    });

    if (hasNewContent && settings.autoTranslate) {
      isProcessing = true;
      setTimeout(() => {
        translateVisibleContent();
        isProcessing = false;
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * 停止监听页面变化
 */
function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// 防止重复注入
if (window.yuyingTranslatorInjected) {
  console.log('语影翻译插件已注入，跳过重复加载');
} else {
  window.yuyingTranslatorInjected = true;
  console.log('语影翻译插件 Content Script 开始加载');

  // 动态加载OCR翻译器
  if (typeof window.OCRTranslator === 'undefined') {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/ocr-translator.js');
    script.onload = () => {
      console.log('OCR翻译器加载完成');
      if (window.OCRTranslator) {
        ocrTranslator = new window.OCRTranslator();
        // 如果翻译已启用，立即初始化OCR
        if (isTranslationEnabled) {
          ocrTranslator.init();
        }
      }
    };
    script.onerror = () => {
      console.error('OCR翻译器加载失败');
    };
    document.head.appendChild(script);
  }

  // 初始化
  init();

  // 页面加载完成后自动翻译
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (isTranslationEnabled && settings.autoTranslate) {
          startTranslation();
        }
      }, 2000);
    });
  } else {
    setTimeout(() => {
      if (isTranslationEnabled && settings.autoTranslate) {
        startTranslation();
      }
    }, 2000);
  }

  console.log('语影翻译插件 Content Script 已初始化');
}
