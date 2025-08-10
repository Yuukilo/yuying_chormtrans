#!/usr/bin/env node
/**
 * 语影翻译插件 - GitHub自动部署脚本
 * 引导用户完成从Git安装到GitHub部署的完整流程
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出函数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 检查命令是否存在
function commandExists(command) {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 执行命令并显示输出
function runCommand(command, description) {
  colorLog(`\n🔄 ${description}...`, 'blue');
  try {
    const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
    colorLog(`✅ ${description}完成`, 'green');
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    colorLog(`❌ ${description}失败: ${error.message}`, 'red');
    return false;
  }
}

// 主要部署流程
async function deployToGitHub() {
  colorLog('🚀 语影翻译插件 GitHub 部署向导', 'cyan');
  colorLog('=' .repeat(50), 'cyan');

  // 步骤1: 检查Git安装
  colorLog('\n📋 步骤 1: 检查环境', 'magenta');
  
  if (!commandExists('git')) {
    colorLog('❌ Git 未安装', 'red');
    colorLog('\n请按照以下步骤安装Git:', 'yellow');
    colorLog('1. 访问 https://git-scm.com/download/win', 'yellow');
    colorLog('2. 下载并安装 Git for Windows', 'yellow');
    colorLog('3. 安装完成后重启命令行', 'yellow');
    colorLog('4. 重新运行此脚本', 'yellow');
    
    const openBrowser = await question('\n是否现在打开Git下载页面? (y/n): ');
    if (openBrowser.toLowerCase() === 'y') {
      try {
        execSync('start https://git-scm.com/download/win');
      } catch (error) {
        colorLog('请手动访问: https://git-scm.com/download/win', 'yellow');
      }
    }
    process.exit(1);
  }
  
  colorLog('✅ Git 已安装', 'green');
  
  // 步骤2: 检查Git配置
  colorLog('\n📋 步骤 2: 检查Git配置', 'magenta');
  
  let gitUserName, gitUserEmail;
  try {
    gitUserName = execSync('git config --global user.name', { encoding: 'utf8' }).trim();
    gitUserEmail = execSync('git config --global user.email', { encoding: 'utf8' }).trim();
    colorLog(`✅ Git用户: ${gitUserName} <${gitUserEmail}>`, 'green');
  } catch {
    colorLog('❌ Git用户信息未配置', 'red');
    
    const userName = await question('请输入您的GitHub用户名: ');
    const userEmail = await question('请输入您的GitHub邮箱: ');
    
    runCommand(`git config --global user.name "${userName}"`, '设置Git用户名');
    runCommand(`git config --global user.email "${userEmail}"`, '设置Git邮箱');
  }
  
  // 步骤3: 检查项目状态
  colorLog('\n📋 步骤 3: 检查项目状态', 'magenta');
  
  if (!fs.existsSync('.git')) {
    colorLog('🔄 初始化Git仓库...', 'blue');
    runCommand('git init', '初始化Git仓库');
  } else {
    colorLog('✅ Git仓库已存在', 'green');
  }
  
  // 步骤4: 获取GitHub仓库信息
  colorLog('\n📋 步骤 4: GitHub仓库配置', 'magenta');
  
  let repoUrl;
  try {
    repoUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    colorLog(`✅ 远程仓库已配置: ${repoUrl}`, 'green');
  } catch {
    colorLog('❌ 远程仓库未配置', 'yellow');
    
    colorLog('\n请先在GitHub上创建仓库:', 'yellow');
    colorLog('1. 访问 https://github.com/new', 'yellow');
    colorLog('2. 仓库名建议: yuying-translation-extension', 'yellow');
    colorLog('3. 设置为公开仓库', 'yellow');
    colorLog('4. 不要初始化README、.gitignore或LICENSE', 'yellow');
    
    const openGitHub = await question('\n是否现在打开GitHub创建页面? (y/n): ');
    if (openGitHub.toLowerCase() === 'y') {
      try {
        execSync('start https://github.com/new');
      } catch (error) {
        colorLog('请手动访问: https://github.com/new', 'yellow');
      }
    }
    
    repoUrl = await question('\n请输入您的GitHub仓库URL (例: https://github.com/username/yuying-translation-extension.git): ');
    
    if (repoUrl) {
      runCommand(`git remote add origin ${repoUrl}`, '添加远程仓库');
    } else {
      colorLog('❌ 仓库URL不能为空', 'red');
      process.exit(1);
    }
  }
  
  // 步骤5: 构建项目
  colorLog('\n📋 步骤 5: 构建项目', 'magenta');
  
  if (fs.existsSync('package.json')) {
    colorLog('🔄 安装依赖...', 'blue');
    runCommand('npm install', '安装项目依赖');
    
    colorLog('🔄 构建项目...', 'blue');
    runCommand('npm run build', '构建项目');
  }
  
  // 步骤6: 提交代码
  colorLog('\n📋 步骤 6: 提交代码', 'magenta');
  
  runCommand('git add .', '添加所有文件');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      runCommand('git commit -m "feat: 语影翻译插件 v1.0.0 - 初始版本"', '提交代码');
    } else {
      colorLog('✅ 没有新的更改需要提交', 'green');
    }
  } catch {
    runCommand('git commit -m "feat: 语影翻译插件 v1.0.0 - 初始版本"', '提交代码');
  }
  
  // 步骤7: 推送代码
  colorLog('\n📋 步骤 7: 推送到GitHub', 'magenta');
  
  const pushResult = runCommand('git push -u origin main', '推送代码到GitHub');
  
  if (!pushResult) {
    colorLog('\n尝试推送到master分支...', 'yellow');
    runCommand('git branch -M main', '重命名分支为main');
    runCommand('git push -u origin main', '推送代码到GitHub');
  }
  
  // 步骤8: 创建版本标签
  colorLog('\n📋 步骤 8: 创建版本标签', 'magenta');
  
  runCommand('git tag v1.0.0', '创建版本标签');
  runCommand('git push origin v1.0.0', '推送版本标签');
  
  // 步骤9: 打包扩展
  colorLog('\n📋 步骤 9: 打包Chrome扩展', 'magenta');
  
  if (fs.existsSync('scripts/build-package.js')) {
    runCommand('node scripts/build-package.js', '打包Chrome扩展');
  } else {
    colorLog('⚠️  打包脚本不存在，请手动打包', 'yellow');
  }
  
  // 完成
  colorLog('\n🎉 部署完成!', 'green');
  colorLog('=' .repeat(50), 'green');
  
  colorLog('\n📋 下一步操作:', 'cyan');
  colorLog('1. 访问您的GitHub仓库查看代码', 'yellow');
  colorLog('2. 在GitHub上创建Release发布版本', 'yellow');
  colorLog('3. 上传打包好的.crx文件到Release', 'yellow');
  colorLog('4. 提交到Chrome Web Store审核', 'yellow');
  
  if (repoUrl) {
    const repoWebUrl = repoUrl.replace('.git', '').replace('git@github.com:', 'https://github.com/');
    colorLog(`\n🔗 仓库地址: ${repoWebUrl}`, 'cyan');
    
    const openRepo = await question('\n是否现在打开GitHub仓库? (y/n): ');
    if (openRepo.toLowerCase() === 'y') {
      try {
        execSync(`start ${repoWebUrl}`);
      } catch (error) {
        colorLog(`请手动访问: ${repoWebUrl}`, 'yellow');
      }
    }
  }
  
  rl.close();
}

// 错误处理
process.on('uncaughtException', (error) => {
  colorLog(`\n❌ 发生错误: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  colorLog('\n\n👋 部署已取消', 'yellow');
  rl.close();
  process.exit(0);
});

// 启动部署流程
if (require.main === module) {
  deployToGitHub().catch((error) => {
    colorLog(`\n❌ 部署失败: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  });
}

module.exports = { deployToGitHub };