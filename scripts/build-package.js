#!/usr/bin/env node

/**
 * 构建和打包脚本
 * 用于快速构建扩展包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
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
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (err) {
    if (!options.silent) {
      error(`命令执行失败: ${command}`);
    }
    throw err;
  }
}

// 清理目录
function cleanDirs() {
  info('清理构建目录...');
  
  const dirsToClean = ['dist', 'release'];
  
  dirsToClean.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
  });
  
  success('目录清理完成');
}

// 构建扩展
function buildExtension() {
  info('构建扩展...');
  
  try {
    exec('npm run build');
    success('扩展构建完成');
  } catch (err) {
    error('扩展构建失败');
    throw err;
  }
}

// 验证构建结果
function validateBuild() {
  info('验证构建结果...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const requiredFiles = [
    'manifest.json',
    'popup.html',
    'js/background.js',
    'js/content.js',
    'js/popup.js'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    error('缺少必要文件:');
    missingFiles.forEach(file => error(`  - ${file}`));
    throw new Error('构建验证失败');
  }
  
  // 验证manifest.json
  const manifestPath = path.join(distPath, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  if (!manifest.version || !manifest.name) {
    throw new Error('manifest.json格式无效');
  }
  
  success('构建验证通过');
  return manifest.version;
}

// 创建ZIP包
function createZipPackage(version) {
  return new Promise((resolve, reject) => {
    info('创建扩展包...');
    
    const packageName = `yuying-translation-extension-v${version}.zip`;
    const packagePath = path.join(process.cwd(), 'release', packageName);
    
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      success(`扩展包创建完成: ${packageName} (${sizeInMB}MB)`);
      resolve(packagePath);
    });
    
    archive.on('error', (err) => {
      error('创建扩展包失败');
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory('dist/', false);
    archive.finalize();
  });
}

// 生成构建报告
function generateBuildReport(version, packagePath) {
  info('生成构建报告...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const stats = fs.statSync(packagePath);
  const packageSize = (stats.size / 1024 / 1024).toFixed(2);
  
  // 计算文件数量
  function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        count += countFiles(itemPath);
      } else {
        count++;
      }
    });
    
    return count;
  }
  
  const fileCount = countFiles(distPath);
  
  const report = {
    version,
    buildTime: new Date().toISOString(),
    packagePath,
    packageSize: `${packageSize}MB`,
    fileCount,
    manifest: JSON.parse(fs.readFileSync(path.join(distPath, 'manifest.json'), 'utf8'))
  };
  
  const reportPath = path.join(process.cwd(), 'release', 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  success('构建报告已生成');
  return report;
}

// 显示构建信息
function showBuildInfo(report) {
  console.log('\n' + '='.repeat(50));
  success('🎉 扩展包构建完成！');
  console.log('='.repeat(50));
  
  console.log('\n📦 构建信息:');
  console.log(`   版本号: v${report.version}`);
  console.log(`   包大小: ${report.packageSize}`);
  console.log(`   文件数: ${report.fileCount}`);
  console.log(`   构建时间: ${new Date(report.buildTime).toLocaleString()}`);
  
  console.log('\n📁 输出文件:');
  console.log(`   扩展包: ${report.packagePath}`);
  console.log(`   构建报告: ${path.join(path.dirname(report.packagePath), 'build-report.json')}`);
  
  console.log('\n🔧 安装方法:');
  console.log('   1. 解压扩展包到本地文件夹');
  console.log('   2. 打开Chrome浏览器，进入 chrome://extensions/');
  console.log('   3. 开启"开发者模式"');
  console.log('   4. 点击"加载已解压的扩展程序"');
  console.log('   5. 选择解压后的文件夹');
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// 主函数
async function main() {
  console.log('\n📦 语影翻译插件构建脚本\n');
  
  try {
    cleanDirs();
    buildExtension();
    const version = validateBuild();
    const packagePath = await createZipPackage(version);
    const report = generateBuildReport(version, packagePath);
    
    showBuildInfo(report);
    
  } catch (err) {
    error('构建失败');
    console.error(err.message);
    process.exit(1);
  }
}

// 处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('\n📦 语影翻译插件构建脚本');
    console.log('\n用法:');
    console.log('  node scripts/build-package.js');
    console.log('\n选项:');
    console.log('  --help, -h    显示帮助信息');
    console.log('\n示例:');
    console.log('  npm run package');
    console.log('  node scripts/build-package.js');
    console.log('');
    process.exit(0);
  }
  
  main();
}

module.exports = {
  cleanDirs,
  buildExtension,
  validateBuild,
  createZipPackage,
  generateBuildReport
};