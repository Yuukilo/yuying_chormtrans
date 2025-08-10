/**
 * 语影翻译插件加载测试脚本
 * 用于验证扩展是否能正常加载和初始化
 */

console.log('开始测试语影翻译插件...');

// 测试函数
function testExtensionLoading() {
    console.log('=== 语影翻译插件测试开始 ===');
    
    // 1. 检查Chrome扩展API是否可用
    if (typeof chrome === 'undefined') {
        console.error('❌ Chrome扩展API不可用');
        return false;
    }
    console.log('✅ Chrome扩展API可用');
    
    // 2. 检查扩展是否已加载
    if (!chrome.runtime || !chrome.runtime.id) {
        console.error('❌ 扩展未正确加载');
        return false;
    }
    console.log('✅ 扩展已加载，ID:', chrome.runtime.id);
    
    // 3. 测试与background script的通信
    console.log('🔄 测试与background script通信...');
    
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { type: 'GET_TRANSLATION_STATUS' },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ 通信失败:', chrome.runtime.lastError.message);
                    resolve(false);
                    return;
                }
                
                if (response) {
                    console.log('✅ 通信成功，响应:', response);
                    console.log('翻译功能状态:', response.enabled ? '已启用' : '未启用');
                    resolve(true);
                } else {
                    console.error('❌ 无响应');
                    resolve(false);
                }
            }
        );
        
        // 设置超时
        setTimeout(() => {
            console.error('❌ 通信超时');
            resolve(false);
        }, 5000);
    });
}

// 测试设置获取
function testGetSettings() {
    console.log('🔄 测试设置获取...');
    
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { type: 'GET_SETTINGS' },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ 获取设置失败:', chrome.runtime.lastError.message);
                    resolve(false);
                    return;
                }
                
                if (response && response.settings) {
                    console.log('✅ 设置获取成功:', response.settings);
                    resolve(true);
                } else {
                    console.error('❌ 设置获取失败，无响应');
                    resolve(false);
                }
            }
        );
        
        setTimeout(() => {
            console.error('❌ 获取设置超时');
            resolve(false);
        }, 5000);
    });
}

// 测试翻译功能
function testTranslation() {
    console.log('🔄 测试翻译功能...');
    
    return new Promise((resolve) => {
        const testText = 'Hello, world!';
        
        chrome.runtime.sendMessage(
            {
                type: 'TRANSLATE_REQUEST',
                text: testText,
                options: {
                    targetLanguage: 'zh-CN'
                }
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ 翻译请求失败:', chrome.runtime.lastError.message);
                    resolve(false);
                    return;
                }
                
                if (response && response.success) {
                    console.log('✅ 翻译成功:', response.result);
                    resolve(true);
                } else if (response && response.error) {
                    console.error('❌ 翻译失败:', response.error);
                    resolve(false);
                } else {
                    console.error('❌ 翻译无响应');
                    resolve(false);
                }
            }
        );
        
        setTimeout(() => {
            console.error('❌ 翻译请求超时');
            resolve(false);
        }, 10000);
    });
}

// 运行所有测试
async function runAllTests() {
    try {
        console.log('\n=== 开始完整测试 ===');
        
        // 基础加载测试
        const loadingTest = await testExtensionLoading();
        if (!loadingTest) {
            console.log('\n❌ 基础加载测试失败，停止后续测试');
            return;
        }
        
        // 设置测试
        const settingsTest = await testGetSettings();
        if (!settingsTest) {
            console.log('\n⚠️ 设置测试失败，但继续其他测试');
        }
        
        // 翻译测试（可能因为API密钥未配置而失败）
        const translationTest = await testTranslation();
        if (!translationTest) {
            console.log('\n⚠️ 翻译测试失败（可能需要配置API密钥）');
        }
        
        console.log('\n=== 测试完成 ===');
        console.log('基础功能:', loadingTest ? '✅ 正常' : '❌ 异常');
        console.log('设置功能:', settingsTest ? '✅ 正常' : '❌ 异常');
        console.log('翻译功能:', translationTest ? '✅ 正常' : '❌ 异常');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 如果在浏览器环境中运行，自动开始测试
if (typeof window !== 'undefined') {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        setTimeout(runAllTests, 1000);
    }
} else {
    // 在Node.js环境中，导出测试函数
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            testExtensionLoading,
            testGetSettings,
            testTranslation,
            runAllTests
        };
    }
}

console.log('测试脚本已加载，等待执行...');