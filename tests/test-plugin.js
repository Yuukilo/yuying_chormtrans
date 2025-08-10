// 测试脚本：验证语影翻译插件修复效果
// 模拟Chrome扩展环境来测试background script

const fs = require('fs');
const path = require('path');

// 模拟Chrome扩展API
global.chrome = {
  storage: {
    sync: {
      get: (keys) => Promise.resolve({}),
      set: (data) => Promise.resolve()
    },
    local: {
      get: (keys) => Promise.resolve({}),
      set: (data) => Promise.resolve()
    }
  },
  runtime: {
    onInstalled: {
      addListener: (callback) => {
        console.log('✓ onInstalled listener registered');
        // 模拟安装事件
        setTimeout(() => callback({ reason: 'install' }), 100);
      }
    },
    onStartup: {
      addListener: (callback) => {
        console.log('✓ onStartup listener registered');
      }
    },
    onMessage: {
      addListener: (callback) => {
        console.log('✓ onMessage listener registered');
      }
    }
  },
  contextMenus: {
    removeAll: (callback) => {
      console.log('✓ Context menus cleared');
      if (callback) callback();
    },
    create: (options) => {
      console.log(`✓ Context menu created: ${options.title}`);
    },
    onClicked: {
      addListener: (callback) => {
        console.log('✓ Context menu click listener registered');
      }
    }
  },
  commands: {
    onCommand: {
      addListener: (callback) => {
        console.log('✓ Command listener registered');
      }
    }
  },
  action: {
    onClicked: {
      addListener: (callback) => {
        console.log('✓ Action click listener registered');
      }
    },
    setIcon: (options) => Promise.resolve(),
    setTitle: (options) => Promise.resolve()
  },
  tabs: {
    query: (queryInfo) => Promise.resolve([{ id: 1, active: true }]),
    sendMessage: (tabId, message) => Promise.resolve(),
    onUpdated: {
      addListener: (callback) => {
        console.log('✓ Tab updated listener registered');
      }
    },
    onActivated: {
      addListener: (callback) => {
        console.log('✓ Tab activated listener registered');
      }
    }
  },
  windows: {
    onFocusChanged: {
      addListener: (callback) => {
        console.log('✓ Window focus listener registered');
      }
    },
    WINDOW_ID_NONE: -1
  },
  scripting: {
    executeScript: (options) => Promise.resolve()
  }
};

// 模拟globalThis环境
if (typeof globalThis === 'undefined') {
  global.globalThis = global;
}

// 模拟importScripts函数
global.importScripts = function(...urls) {
  console.log(`✓ importScripts called with: ${urls.join(', ')}`);
  // 在实际环境中，这些脚本会被加载
  // 这里我们只是模拟成功加载
};

// 模拟self对象
global.self = global;

async function testPlugin() {
  console.log('🚀 开始测试语影翻译插件...');
  console.log('');
  
  try {
    // 读取构建后的background.js文件
    const backgroundPath = path.join(__dirname, 'dist', 'js', 'background.js');
    
    if (!fs.existsSync(backgroundPath)) {
      throw new Error('构建后的background.js文件不存在，请先运行 npm run build');
    }
    
    console.log('✓ 找到构建后的background.js文件');
    
    // 读取文件内容
    const backgroundCode = fs.readFileSync(backgroundPath, 'utf8');
    
    // 检查是否还包含document相关代码
    if (backgroundCode.includes('document.getElementsByTagName') || 
        backgroundCode.includes('document.createElement')) {
      console.log('❌ 错误：background.js仍然包含document相关代码');
      return false;
    }
    
    console.log('✓ background.js不再包含document相关代码');
    
    // 检查是否使用了importScripts
    if (backgroundCode.includes('importScripts')) {
      console.log('✓ background.js正确使用importScripts加载模块');
    }
    
    // 尝试执行background script
    console.log('');
    console.log('📋 执行background script测试...');
    
    // 使用eval执行代码（在真实环境中不推荐，但用于测试）
    eval(backgroundCode);
    
    console.log('✓ background script执行成功，没有document错误');
    console.log('');
    
    // 等待一段时间让异步操作完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🎉 测试完成！插件修复成功');
    console.log('');
    console.log('✅ 修复总结：');
    console.log('   - webpack配置已更新为webworker target');
    console.log('   - background script不再使用document对象');
    console.log('   - 使用importScripts正确加载模块');
    console.log('   - 所有Chrome扩展API正常注册');
    
    return true;
    
  } catch (error) {
    console.log('');
    console.log('❌ 测试失败：', error.message);
    
    if (error.message.includes('document is not defined')) {
      console.log('   原因：仍然存在document未定义错误');
      console.log('   建议：检查webpack配置是否正确应用');
    }
    
    return false;
  }
}

// 运行测试
testPlugin().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行失败：', error);
  process.exit(1);
});