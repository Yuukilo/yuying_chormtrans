#!/usr/bin/env node

/**
 * 语影翻译插件构建脚本
 * 用于生成生产环境的扩展包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建配置
const BUILD_CONFIG = {
  sourceDir: path.join(__dirname, '..'),
  distDir: path.join(__dirname, '..', 'dist'),
  packageName: 'yuying-translation-extension',
  version: require('../package.json').version
};

// 需要复制的文件和目录
const COPY_PATTERNS = [
  'manifest.json',
  'js/',
  'css/',
  'icons/',
  'popup.html',
  '_locales/'
];

// 需要排除的文件
const EXCLUDE_PATTERNS = [
  '*.map',
  '*.dev.js',
  'test/',
  'spec/',
  '.DS_Store',
  'Thumbs.db'
];

/**
 * 清理构建目录
 */
function cleanDist() {
  console.log('🧹 清理构建目录...');
  if (fs.existsSync(BUILD_CONFIG.distDir)) {
    fs.rmSync(BUILD_CONFIG.distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(BUILD_CONFIG.distDir, { recursive: true });
}

/**
 * 复制文件到构建目录
 */
function copyFiles() {
  console.log('📁 复制文件到构建目录...');
  
  COPY_PATTERNS.forEach(pattern => {
    const sourcePath = path.join(BUILD_CONFIG.sourceDir, pattern);
    const destPath = path.join(BUILD_CONFIG.distDir, pattern);
    
    if (fs.existsSync(sourcePath)) {
      const stat = fs.statSync(sourcePath);
      
      if (stat.isDirectory()) {
        // 复制目录
        copyDirectory(sourcePath, destPath);
      } else {
        // 复制文件
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
      }
      
      console.log(`  ✅ ${pattern}`);
    } else {
      console.log(`  ⚠️  ${pattern} 不存在，跳过`);
    }
  });
}

/**
 * 递归复制目录
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // 检查是否需要排除
    if (shouldExclude(entry.name)) {
      return;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

/**
 * 检查文件是否应该被排除
 */
function shouldExclude(filename) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filename);
    }
    return filename === pattern || filename.endsWith(pattern);
  });
}

/**
 * 优化manifest.json
 */
function optimizeManifest() {
  console.log('⚙️  优化manifest.json...');
  
  const manifestPath = path.join(BUILD_CONFIG.distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // 移除开发相关的权限和配置
  if (manifest.permissions) {
    manifest.permissions = manifest.permissions.filter(permission => 
      !permission.includes('localhost') && 
      !permission.includes('127.0.0.1')
    );
  }
  
  // 确保版本号正确
  manifest.version = BUILD_CONFIG.version;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('  ✅ manifest.json 已优化');
}

/**
 * 创建压缩包
 */
function createZip() {
  console.log('📦 创建扩展包...');
  
  const zipName = `${BUILD_CONFIG.packageName}-v${BUILD_CONFIG.version}.zip`;
  const zipPath = path.join(BUILD_CONFIG.sourceDir, zipName);
  
  try {
    // 使用PowerShell创建zip文件
    const command = `powershell "Compress-Archive -Path '${BUILD_CONFIG.distDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`  ✅ 扩展包已创建: ${zipName}`);
    
    // 显示文件大小
    const stats = fs.statSync(zipPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  📊 文件大小: ${sizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ 创建压缩包失败:', error.message);
    process.exit(1);
  }
}

/**
 * 验证构建结果
 */
function validateBuild() {
  console.log('🔍 验证构建结果...');
  
  const requiredFiles = ['manifest.json', 'js/background.js', 'js/content.js', 'popup.html'];
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(BUILD_CONFIG.distDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.error('❌ 构建验证失败，缺少文件:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }
  
  console.log('  ✅ 构建验证通过');
}

/**
 * 主构建流程
 */
function main() {
  console.log('🚀 开始构建语影翻译插件...');
  console.log(`📋 版本: ${BUILD_CONFIG.version}`);
  console.log('');
  
  try {
    cleanDist();
    copyFiles();
    optimizeManifest();
    validateBuild();
    createZip();
    
    console.log('');
    console.log('🎉 构建完成！');
    console.log(`📁 构建目录: ${BUILD_CONFIG.distDir}`);
    console.log('💡 提示: 可以将dist目录加载到浏览器进行测试');
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 运行构建
if (require.main === module) {
  main();
}

module.exports = {
  BUILD_CONFIG,
  cleanDist,
  copyFiles,
  optimizeManifest,
  validateBuild,
  createZip
};