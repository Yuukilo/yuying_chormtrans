#!/usr/bin/env node

/**
 * 语影翻译插件发布脚本
 * 自动化版本发布流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 执行命令
function exec(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result;
  } catch (err) {
    if (!options.silent) {
      error(`命令执行失败: ${command}`);
      error(err.message);
    }
    throw err;
  }
}

// 检查Git状态
function checkGitStatus() {
  info('检查Git状态...');
  
  try {
    const status = exec('git status --porcelain', { silent: true });
    if (status.trim()) {
      error('工作目录不干净，请先提交或暂存所有更改');
      console.log(status);
      process.exit(1);
    }
    
    const branch = exec('git branch --show-current', { silent: true }).trim();
    if (branch !== 'main' && branch !== 'master') {
      warning(`当前分支: ${branch}`);
      warning('建议在main/master分支上发布版本');
    }
    
    success('Git状态检查通过');
  } catch (err) {
    error('Git状态检查失败');
    process.exit(1);
  }
}

// 运行测试
function runTests() {
  info('运行代码质量检查...');
  
  try {
    exec('npm run lint');
    success('ESLint检查通过');
    
    exec('npm run check');
    success('TypeScript检查通过');
    
    exec('npm run build');
    success('构建成功');
  } catch (err) {
    error('代码质量检查失败，请修复后重试');
    process.exit(1);
  }
}

// 更新版本号
function updateVersion(versionType) {
  info(`更新版本号 (${versionType})...`);
  
  try {
    const result = exec(`npm version ${versionType} --no-git-tag-version`, { silent: true });
    const newVersion = result.trim().replace('v', '');
    
    // 更新manifest.json
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    success(`版本号已更新为: ${newVersion}`);
    return newVersion;
  } catch (err) {
    error('版本号更新失败');
    process.exit(1);
  }
}

// 更新CHANGELOG
function updateChangelog(version) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  
  if (!fs.existsSync(changelogPath)) {
    warning('CHANGELOG.md不存在，跳过更新');
    return;
  }
  
  info('更新CHANGELOG.md...');
  
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `\n## [${version}] - ${today}\n\n### 新增\n- \n\n### 修复\n- \n\n### 改进\n- \n\n`;
  
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const lines = changelog.split('\n');
  
  // 找到第一个版本条目的位置
  let insertIndex = lines.findIndex(line => line.match(/^## \[\d+\.\d+\.\d+\]/));
  if (insertIndex === -1) {
    insertIndex = lines.findIndex(line => line.startsWith('## '));
  }
  
  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, ...newEntry.split('\n'));
    fs.writeFileSync(changelogPath, lines.join('\n'));
    success('CHANGELOG.md已更新');
  } else {
    warning('无法自动更新CHANGELOG.md，请手动添加版本信息');
  }
}

// 创建Git提交和标签
function createGitTag(version) {
  info('创建Git提交和标签...');
  
  try {
    exec('git add .');
    exec(`git commit -m "chore: release v${version}"`);
    exec(`git tag -a v${version} -m "Release version ${version}"`);
    
    success(`Git标签 v${version} 创建成功`);
  } catch (err) {
    error('Git标签创建失败');
    process.exit(1);
  }
}

// 推送到远程仓库
function pushToRemote(version) {
  info('推送到远程仓库...');
  
  try {
    exec('git push origin main');
    exec(`git push origin v${version}`);
    
    success('代码已推送到远程仓库');
    success('GitHub Actions将自动创建Release');
  } catch (err) {
    error('推送失败');
    process.exit(1);
  }
}

// 创建扩展包
function createExtensionPackage(version) {
  info('创建扩展包...');
  
  try {
    const releaseDir = path.join(process.cwd(), 'release');
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir);
    }
    
    const packageName = `yuying-translation-extension-v${version}.zip`;
    const packagePath = path.join(releaseDir, packageName);
    
    // 删除旧的包文件
    if (fs.existsSync(packagePath)) {
      fs.unlinkSync(packagePath);
    }
    
    // 创建新的包
    exec(`cd dist && zip -r ../${packagePath} .`);
    
    success(`扩展包已创建: ${packagePath}`);
    return packagePath;
  } catch (err) {
    error('扩展包创建失败');
    process.exit(1);
  }
}

// 显示发布信息
function showReleaseInfo(version, packagePath) {
  console.log('\n' + '='.repeat(50));
  success(`🎉 版本 v${version} 发布成功！`);
  console.log('='.repeat(50));
  
  console.log('\n📦 发布信息:');
  console.log(`   版本号: v${version}`);
  console.log(`   扩展包: ${packagePath}`);
  console.log(`   构建时间: ${new Date().toLocaleString()}`);
  
  console.log('\n🔗 相关链接:');
  console.log('   GitHub Releases: https://github.com/YOUR_USERNAME/yuying-translation-extension/releases');
  console.log('   Chrome Web Store: https://chrome.google.com/webstore/developer/dashboard');
  
  console.log('\n📋 下一步操作:');
  console.log('   1. 等待GitHub Actions完成自动构建');
  console.log('   2. 检查GitHub Release页面');
  console.log('   3. 下载自动生成的扩展包');
  console.log('   4. 上传到Chrome Web Store（如需要）');
  console.log('   5. 更新文档和通知用户');
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// 询问用户输入
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// 主函数
async function main() {
  console.log('\n🚀 语影翻译插件发布脚本\n');
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  let versionType = args[0];
  
  if (!versionType) {
    console.log('请选择版本类型:');
    console.log('  1. patch  - 修复版本 (1.0.0 -> 1.0.1)');
    console.log('  2. minor  - 功能版本 (1.0.0 -> 1.1.0)');
    console.log('  3. major  - 主要版本 (1.0.0 -> 2.0.0)');
    console.log('  4. beta   - 测试版本 (1.0.0 -> 1.0.1-beta.0)');
    
    const choice = await askQuestion('\n请输入选择 (1-4): ');
    
    switch (choice) {
      case '1':
        versionType = 'patch';
        break;
      case '2':
        versionType = 'minor';
        break;
      case '3':
        versionType = 'major';
        break;
      case '4':
        versionType = 'prerelease --preid=beta';
        break;
      default:
        error('无效选择');
        process.exit(1);
    }
  }
  
  try {
    // 执行发布流程
    checkGitStatus();
    runTests();
    
    const version = updateVersion(versionType);
    updateChangelog(version);
    
    const confirm = await askQuestion(`\n确认发布版本 v${version}? (y/N): `);
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      warning('发布已取消');
      process.exit(0);
    }
    
    createGitTag(version);
    const packagePath = createExtensionPackage(version);
    pushToRemote(version);
    
    showReleaseInfo(version, packagePath);
    
  } catch (err) {
    error('发布失败');
    console.error(err);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  error('未捕获的异常:');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  error('未处理的Promise拒绝:');
  console.error(err);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkGitStatus,
  runTests,
  updateVersion,
  createGitTag,
  pushToRemote,
  createExtensionPackage
};