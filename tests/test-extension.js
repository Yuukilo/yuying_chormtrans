/**
 * 语影翻译插件测试脚本
 * 用于自动化测试插件的各项功能
 */

// 测试配置
const TEST_CONFIG = {
  deepseekApiKey: 'sk-9adc3a701ba64a4d9df52408da8bb052',
  testText: 'Hello, this is a test for translation functionality.',
  targetLanguage: 'zh-CN'
};

// 测试结果记录
const testResults = {
  apiConfiguration: null,
  basicTranslation: null,
  floatingBox: null,
  settingsPanel: null,
  shortcuts: null,
  cache: null,
  multiLanguage: null
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始语影翻译插件完整测试');
  
  try {
    // 测试1: API配置
    await testAPIConfiguration();
    
    // 测试2: 基础翻译功能
    await testBasicTranslation();
    
    // 测试3: 浮动框显示和交互
    await testFloatingBox();
    
    // 测试4: 设置面板功能
    await testSettingsPanel();
    
    // 测试5: 快捷键功能
    await testShortcuts();
    
    // 测试6: 缓存机制
    await testCacheSystem();
    
    // 测试7: 多语言支持
    await testMultiLanguageSupport();
    
    // 生成测试报告
    generateTestReport();
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 测试1: API配置
 */
async function testAPIConfiguration() {
  console.log('\n📋 测试1: API配置');
  
  try {
    // 检查扩展是否已加载
    if (!chrome || !chrome.runtime) {
      throw new Error('Chrome扩展API不可用，请确保在扩展环境中运行');
    }
    
    // 配置DeepSeek API密钥
    const settings = {
      apiKey: TEST_CONFIG.deepseekApiKey,
      apiProvider: 'deepseek',
      targetLanguage: TEST_CONFIG.targetLanguage,
      autoTranslate: false,
      positionPreference: 'right',
      fontSize: 14,
      transparency: 0.8
    };
    
    // 发送设置更新消息
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: settings
    });
    
    if (response && response.success) {
      console.log('✅ API密钥配置成功');
      testResults.apiConfiguration = {
        status: 'success',
        message: 'DeepSeek API密钥配置成功',
        details: {
          provider: 'deepseek',
          keyLength: TEST_CONFIG.deepseekApiKey.length
        }
      };
    } else {
      throw new Error('API密钥配置失败');
    }
    
    // 测试API连接
    const testResponse = await chrome.runtime.sendMessage({
      type: 'TEST_API',
      provider: 'deepseek',
      apiKey: TEST_CONFIG.deepseekApiKey
    });
    
    if (testResponse && testResponse.success) {
      console.log('✅ API连接测试成功');
      testResults.apiConfiguration.apiTest = 'success';
    } else {
      console.log('⚠️ API连接测试失败:', testResponse.message);
      testResults.apiConfiguration.apiTest = 'failed';
      testResults.apiConfiguration.apiTestError = testResponse.message;
    }
    
  } catch (error) {
    console.error('❌ API配置测试失败:', error);
    testResults.apiConfiguration = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 测试2: 基础翻译功能
 */
async function testBasicTranslation() {
  console.log('\n🔤 测试2: 基础翻译功能');
  
  try {
    // 发送翻译请求
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      text: TEST_CONFIG.testText,
      targetLanguage: TEST_CONFIG.targetLanguage
    });
    
    if (response && response.success && response.translation) {
      console.log('✅ 翻译功能正常');
      console.log(`原文: ${TEST_CONFIG.testText}`);
      console.log(`译文: ${response.translation}`);
      
      testResults.basicTranslation = {
        status: 'success',
        originalText: TEST_CONFIG.testText,
        translatedText: response.translation,
        responseTime: response.responseTime || 'N/A'
      };
    } else {
      throw new Error('翻译请求失败: ' + (response.message || '未知错误'));
    }
    
  } catch (error) {
    console.error('❌ 基础翻译测试失败:', error);
    testResults.basicTranslation = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 测试3: 浮动框显示和交互
 */
async function testFloatingBox() {
  console.log('\n💬 测试3: 浮动框显示和交互');
  
  try {
    // 这个测试需要在网页内容脚本中进行
    // 这里我们检查content script是否正确注入
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (tabs.length > 0) {
      // 向当前标签页注入测试脚本
      await chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: testFloatingBoxInPage
      });
      
      console.log('✅ 浮动框测试脚本已注入');
      testResults.floatingBox = {
        status: 'success',
        message: '浮动框测试脚本已注入到当前页面'
      };
    } else {
      throw new Error('无法找到活动标签页');
    }
    
  } catch (error) {
    console.error('❌ 浮动框测试失败:', error);
    testResults.floatingBox = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 在页面中测试浮动框的函数
 */
function testFloatingBoxInPage() {
  console.log('🔍 在页面中测试浮动框功能');
  
  // 创建测试文本元素
  const testElement = document.createElement('p');
  testElement.textContent = 'This is a test text for floating box.';
  testElement.style.cssText = `
    position: fixed;
    top: 100px;
    left: 100px;
    padding: 10px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    z-index: 9999;
    font-size: 16px;
  `;
  testElement.id = 'yuying-test-element';
  document.body.appendChild(testElement);
  
  // 模拟文本选择
  setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(testElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 触发选择事件
    const event = new Event('mouseup', {bubbles: true});
    testElement.dispatchEvent(event);
    
    console.log('✅ 文本选择事件已触发，检查是否显示浮动框');
  }, 1000);
}

/**
 * 测试4: 设置面板功能
 */
async function testSettingsPanel() {
  console.log('\n⚙️ 测试4: 设置面板功能');
  
  try {
    // 获取当前设置
    const response = await chrome.runtime.sendMessage({type: 'GET_SETTINGS'});
    
    if (response && response.settings) {
      console.log('✅ 设置获取成功');
      console.log('当前设置:', response.settings);
      
      testResults.settingsPanel = {
        status: 'success',
        currentSettings: response.settings
      };
    } else {
      throw new Error('无法获取设置');
    }
    
  } catch (error) {
    console.error('❌ 设置面板测试失败:', error);
    testResults.settingsPanel = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 测试5: 快捷键功能
 */
async function testShortcuts() {
  console.log('\n⌨️ 测试5: 快捷键功能');
  
  try {
    // 检查快捷键是否已注册
    const commands = await chrome.commands.getAll();
    
    if (commands && commands.length > 0) {
      console.log('✅ 快捷键已注册:');
      commands.forEach(command => {
        console.log(`  ${command.name}: ${command.shortcut || '未设置'}`);
      });
      
      testResults.shortcuts = {
        status: 'success',
        registeredCommands: commands
      };
    } else {
      console.log('⚠️ 未找到已注册的快捷键');
      testResults.shortcuts = {
        status: 'warning',
        message: '未找到已注册的快捷键'
      };
    }
    
  } catch (error) {
    console.error('❌ 快捷键测试失败:', error);
    testResults.shortcuts = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 测试6: 缓存机制
 */
async function testCacheSystem() {
  console.log('\n💾 测试6: 缓存机制');
  
  try {
    // 获取缓存统计
    const response = await chrome.runtime.sendMessage({type: 'GET_USAGE_STATS'});
    
    if (response && response.cache) {
      console.log('✅ 缓存系统正常');
      console.log('缓存统计:', response.cache);
      
      testResults.cache = {
        status: 'success',
        cacheStats: response.cache
      };
    } else {
      console.log('⚠️ 缓存统计不可用');
      testResults.cache = {
        status: 'warning',
        message: '缓存统计不可用'
      };
    }
    
  } catch (error) {
    console.error('❌ 缓存测试失败:', error);
    testResults.cache = {
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * 测试7: 多语言支持
 */
async function testMultiLanguageSupport() {
  console.log('\n🌍 测试7: 多语言支持');
  
  const testLanguages = [
    {code: 'en', text: 'Hello world'},
    {code: 'ja', text: 'こんにちは'},
    {code: 'ko', text: '안녕하세요'},
    {code: 'fr', text: 'Bonjour le monde'}
  ];
  
  const results = [];
  
  for (const lang of testLanguages) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        text: lang.text,
        targetLanguage: 'zh-CN'
      });
      
      if (response && response.success) {
        console.log(`✅ ${lang.code}: ${lang.text} → ${response.translation}`);
        results.push({
          language: lang.code,
          original: lang.text,
          translation: response.translation,
          status: 'success'
        });
      } else {
        console.log(`❌ ${lang.code}: 翻译失败`);
        results.push({
          language: lang.code,
          original: lang.text,
          status: 'failed',
          error: response.message
        });
      }
    } catch (error) {
      console.log(`❌ ${lang.code}: 翻译出错 - ${error.message}`);
      results.push({
        language: lang.code,
        original: lang.text,
        status: 'error',
        error: error.message
      });
    }
    
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  testResults.multiLanguage = {
    status: 'completed',
    results: results
  };
}

/**
 * 生成测试报告
 */
function generateTestReport() {
  console.log('\n📊 测试报告生成');
  console.log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    results: testResults,
    summary: {
      total: Object.keys(testResults).length,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };
  
  // 统计测试结果
  Object.values(testResults).forEach(result => {
    if (result && result.status === 'success') {
      report.summary.passed++;
    } else if (result && result.status === 'failed') {
      report.summary.failed++;
    } else if (result && result.status === 'warning') {
      report.summary.warnings++;
    }
  });
  
  console.log('🎯 测试总结:');
  console.log(`  总测试数: ${report.summary.total}`);
  console.log(`  通过: ${report.summary.passed}`);
  console.log(`  失败: ${report.summary.failed}`);
  console.log(`  警告: ${report.summary.warnings}`);
  
  console.log('\n📋 详细结果:');
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result ? result.status : 'unknown';
    const icon = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`  ${icon} ${testName}: ${status}`);
    if (result && result.error) {
      console.log(`    错误: ${result.error}`);
    }
  });
  
  // 保存报告到localStorage
  try {
    localStorage.setItem('yuying-test-report', JSON.stringify(report, null, 2));
    console.log('\n💾 测试报告已保存到localStorage');
  } catch (error) {
    console.error('保存测试报告失败:', error);
  }
  
  console.log('\n🏁 测试完成!');
  return report;
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    testResults,
    generateTestReport
  };
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
  // 等待页面加载完成后运行测试
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    runTests();
  }
}