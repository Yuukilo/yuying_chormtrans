// 语影翻译插件简化测试脚本
// 用于验证扩展的基本功能

class ExtensionTester {
  constructor() {
    this.apiKey = 'sk-9adc3a701ba64a4d9df52408da8bb052';
    this.testResults = [];
    this.currentTest = 0;
    this.totalTests = 7;
  }

  // 初始化测试
  async init() {
    console.log('🚀 开始语影翻译插件测试');
    this.updateProgress(0);
    
    // 检查扩展是否已加载
    if (!chrome || !chrome.runtime) {
      this.logError('Chrome扩展API不可用，请确保在扩展环境中运行');
      return;
    }

    await this.runAllTests();
  }

  // 运行所有测试
  async runAllTests() {
    const tests = [
      { name: '检查扩展状态', fn: this.testExtensionStatus },
      { name: '配置API密钥', fn: this.testApiConfiguration },
      { name: '测试API连接', fn: this.testApiConnection },
      { name: '测试翻译功能', fn: this.testTranslation },
      { name: '测试设置保存', fn: this.testSettingsSave },
      { name: '测试缓存机制', fn: this.testCaching },
      { name: '生成测试报告', fn: this.generateReport }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      this.currentTest = i + 1;
      this.updateProgress((i / tests.length) * 100);
      
      console.log(`\n📋 测试 ${this.currentTest}/${this.totalTests}: ${test.name}`);
      
      try {
        const result = await test.fn.call(this);
        this.testResults.push({
          name: test.name,
          status: 'passed',
          result: result,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ ${test.name} - 通过`);
      } catch (error) {
        this.testResults.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error(`❌ ${test.name} - 失败:`, error.message);
      }
      
      // 测试间隔
      await this.sleep(500);
    }

    this.updateProgress(100);
    console.log('\n🎉 所有测试完成！');
  }

  // 测试1: 检查扩展状态
  async testExtensionStatus() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'GET_TRANSLATION_STATUS' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`扩展通信失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response && typeof response.enabled !== 'undefined') {
            resolve({ enabled: response.enabled, message: '扩展状态正常' });
          } else {
            reject(new Error('无法获取扩展状态'));
          }
        }
      );
    });
  }

  // 测试2: 配置API密钥
  async testApiConfiguration() {
    const settings = {
      apiKey: this.apiKey,
      apiProvider: 'deepseek',
      targetLanguage: 'zh-CN',
      autoTranslate: false,
      positionPreference: 'right',
      fontSize: 14,
      transparency: 0.8
    };

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'UPDATE_SETTINGS', settings: settings },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`设置保存失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response && response.success) {
            resolve({ message: 'API密钥配置成功', settings: settings });
          } else {
            reject(new Error(response?.error || '设置保存失败'));
          }
        }
      );
    });
  }

  // 测试3: 测试API连接
  async testApiConnection() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          type: 'TEST_API', 
          provider: 'deepseek', 
          apiKey: this.apiKey 
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`API测试失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response && response.success) {
            resolve({ message: 'API连接成功', response: response });
          } else {
            reject(new Error(response?.error || response?.message || 'API连接失败'));
          }
        }
      );
    });
  }

  // 测试4: 测试翻译功能
  async testTranslation() {
    const testText = 'Hello, this is a test for translation functionality.';
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          type: 'TRANSLATE_REQUEST', 
          text: testText,
          options: { targetLanguage: 'zh-CN' }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`翻译请求失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response && response.success && response.result) {
            const result = response.result;
            resolve({ 
              originalText: testText,
              translatedText: result.translatedText,
              fromCache: result.fromCache,
              message: '翻译功能正常'
            });
          } else {
            reject(new Error(response?.error || '翻译失败'));
          }
        }
      );
    });
  }

  // 测试5: 测试设置保存和加载
  async testSettingsSave() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'GET_SETTINGS' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`获取设置失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response && response.settings) {
            const settings = response.settings;
            if (settings.apiKey === this.apiKey && settings.apiProvider === 'deepseek') {
              resolve({ message: '设置保存和加载正常', settings: settings });
            } else {
              reject(new Error('设置未正确保存'));
            }
          } else {
            reject(new Error('无法获取设置'));
          }
        }
      );
    });
  }

  // 测试6: 测试缓存机制
  async testCaching() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'GET_USAGE_STATS' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`获取缓存统计失败: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (response) {
            resolve({ 
              message: '缓存机制正常',
              usage: response.usage || {},
              cache: response.cache || {}
            });
          } else {
            reject(new Error('无法获取缓存统计'));
          }
        }
      );
    });
  }

  // 测试7: 生成测试报告
  async generateReport() {
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const successRate = (passedTests / this.testResults.length * 100).toFixed(1);

    const report = {
      summary: {
        totalTests: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        successRate: `${successRate}%`,
        timestamp: new Date().toISOString()
      },
      details: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // 显示报告
    this.displayReport(report);
    
    return { message: '测试报告生成完成', report: report };
  }

  // 生成建议
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    
    if (failedTests.length === 0) {
      recommendations.push('✅ 所有测试通过，插件功能正常');
      recommendations.push('🔧 建议定期检查API密钥有效性');
      recommendations.push('📊 建议监控翻译质量和响应时间');
    } else {
      recommendations.push('⚠️ 发现以下问题需要修复:');
      failedTests.forEach(test => {
        recommendations.push(`   - ${test.name}: ${test.error}`);
      });
    }
    
    return recommendations;
  }

  // 显示测试报告
  displayReport(report) {
    console.log('\n📊 ===== 语影翻译插件测试报告 =====');
    console.log(`测试时间: ${report.summary.timestamp}`);
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`成功率: ${report.summary.successRate}`);
    
    console.log('\n📋 详细结果:');
    report.details.forEach((test, index) => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}`);
      if (test.status === 'failed') {
        console.log(`   错误: ${test.error}`);
      }
    });
    
    console.log('\n💡 建议:');
    report.recommendations.forEach(rec => {
      console.log(rec);
    });
    
    console.log('\n===== 测试报告结束 =====');
    
    // 更新页面显示
    this.updateTestResults(report);
  }

  // 更新进度条
  updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}% (${this.currentTest}/${this.totalTests})`;
    }
  }

  // 更新测试结果显示
  updateTestResults(report) {
    const resultsDiv = document.getElementById('test-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
      <h3>📊 测试报告</h3>
      <div class="summary">
        <p><strong>总测试数:</strong> ${report.summary.totalTests}</p>
        <p><strong>通过:</strong> <span style="color: green">${report.summary.passed}</span></p>
        <p><strong>失败:</strong> <span style="color: red">${report.summary.failed}</span></p>
        <p><strong>成功率:</strong> ${report.summary.successRate}</p>
      </div>
      
      <h4>详细结果:</h4>
      <ul>
        ${report.details.map(test => `
          <li>
            ${test.status === 'passed' ? '✅' : '❌'} ${test.name}
            ${test.status === 'failed' ? `<br><small style="color: red">错误: ${test.error}</small>` : ''}
          </li>
        `).join('')}
      </ul>
      
      <h4>建议:</h4>
      <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    `;
  }

  // 记录错误
  logError(message) {
    console.error('❌', message);
    const consoleDiv = document.getElementById('console-output');
    if (consoleDiv) {
      consoleDiv.innerHTML += `<div style="color: red">❌ ${message}</div>`;
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 全局测试实例
window.extensionTester = new ExtensionTester();

// 自动运行测试的函数
window.runExtensionTest = async function() {
  const consoleDiv = document.getElementById('console-output');
  if (consoleDiv) {
    consoleDiv.innerHTML = '<div>🚀 开始测试...</div>';
  }
  
  await window.extensionTester.init();
};

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 测试页面已加载，可以开始测试');
  });
} else {
  console.log('📄 测试页面已加载，可以开始测试');
}

console.log('🔧 语影翻译插件测试脚本已加载');
console.log('💡 使用 runExtensionTest() 开始测试');
console.log('💡 使用 window.extensionTester 访问测试实例');