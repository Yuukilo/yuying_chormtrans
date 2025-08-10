#!/usr/bin/env node

/**
 * 版本一致性检查脚本
 * 检查 package.json 和 manifest.json 中的版本号是否一致
 */

const fs = require('fs');
const path = require('path');

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

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`无法读取文件 ${filePath}: ${err.message}`);
    return null;
  }
}

// 验证版本号格式
function isValidVersion(version) {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

// 比较版本号
function compareVersions(v1, v2) {
  const parts1 = v1.split(/[.-]/);
  const parts2 = v2.split(/[.-]/);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parseInt(parts1[i] || '0');
    const part2 = parseInt(parts2[i] || '0');
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

// 检查版本一致性
function checkVersionConsistency() {
  console.log('\n🔍 检查版本一致性...\n');
  
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const manifestJsonPath = path.join(projectRoot, 'manifest.json');
  const distManifestPath = path.join(projectRoot, 'dist', 'manifest.json');
  
  // 读取文件
  const packageJson = readJsonFile(packageJsonPath);
  const manifestJson = readJsonFile(manifestJsonPath);
  const distManifest = fs.existsSync(distManifestPath) ? readJsonFile(distManifestPath) : null;
  
  if (!packageJson || !manifestJson) {
    error('无法读取必要的配置文件');
    return false;
  }
  
  const versions = {
    'package.json': packageJson.version,
    'manifest.json': manifestJson.version
  };
  
  if (distManifest) {
    versions['dist/manifest.json'] = distManifest.version;
  }
  
  // 显示版本信息
  console.log('📋 当前版本信息:');
  Object.entries(versions).forEach(([file, version]) => {
    const isValid = isValidVersion(version);
    const status = isValid ? '✅' : '❌';
    console.log(`   ${status} ${file}: ${version}`);
    
    if (!isValid) {
      error(`   版本号格式无效: ${version}`);
    }
  });
  
  // 检查一致性
  const uniqueVersions = [...new Set(Object.values(versions))];
  
  if (uniqueVersions.length === 1) {
    success('\n✅ 所有文件的版本号一致');
    return true;
  } else {
    error('\n❌ 版本号不一致');
    console.log('\n🔧 发现的版本差异:');
    
    Object.entries(versions).forEach(([file, version]) => {
      console.log(`   ${file}: ${version}`);
    });
    
    return false;
  }
}

// 检查版本号格式
function checkVersionFormat() {
  console.log('\n🔍 检查版本号格式...\n');
  
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  const packageJson = readJsonFile(packageJsonPath);
  if (!packageJson) {
    return false;
  }
  
  const version = packageJson.version;
  const isValid = isValidVersion(version);
  
  if (isValid) {
    success(`版本号格式正确: ${version}`);
    
    // 解析版本号组件
    const [main, prerelease] = version.split('-');
    const [major, minor, patch] = main.split('.');
    
    console.log('\n📊 版本号组件:');
    console.log(`   主版本号 (MAJOR): ${major}`);
    console.log(`   次版本号 (MINOR): ${minor}`);
    console.log(`   修订号 (PATCH): ${patch}`);
    
    if (prerelease) {
      console.log(`   预发布标识: ${prerelease}`);
    }
    
    return true;
  } else {
    error(`版本号格式无效: ${version}`);
    console.log('\n💡 正确的版本号格式示例:');
    console.log('   1.0.0');
    console.log('   1.2.3');
    console.log('   2.0.0-beta.1');
    console.log('   1.0.0-alpha.2');
    
    return false;
  }
}

// 检查Git标签
function checkGitTags() {
  console.log('\n🔍 检查Git标签...\n');
  
  const { execSync } = require('child_process');
  
  try {
    // 检查是否在Git仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch (err) {
    warning('当前目录不是Git仓库，跳过标签检查');
    return true;
  }
  
  try {
    const packageJson = readJsonFile(path.join(process.cwd(), 'package.json'));
    if (!packageJson) {
      return false;
    }
    
    const currentVersion = packageJson.version;
    const expectedTag = `v${currentVersion}`;
    
    // 获取所有标签
    const tags = execSync('git tag', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    
    console.log('📋 现有Git标签:');
    if (tags.length === 0) {
      warning('没有找到Git标签');
    } else {
      tags.slice(-5).forEach(tag => {
        const isCurrent = tag === expectedTag;
        const status = isCurrent ? '👉' : '  ';
        console.log(`   ${status} ${tag}`);
      });
      
      if (tags.length > 5) {
        console.log(`   ... 还有 ${tags.length - 5} 个标签`);
      }
    }
    
    // 检查当前版本是否有对应标签
    if (tags.includes(expectedTag)) {
      success(`\n✅ 找到对应标签: ${expectedTag}`);
    } else {
      warning(`\n⚠️  未找到对应标签: ${expectedTag}`);
      console.log('\n💡 创建标签的命令:');
      console.log(`   git tag -a ${expectedTag} -m "Release version ${currentVersion}"`);
      console.log(`   git push origin ${expectedTag}`);
    }
    
    return true;
  } catch (err) {
    error(`检查Git标签时出错: ${err.message}`);
    return false;
  }
}

// 生成版本报告
function generateVersionReport() {
  console.log('\n📊 生成版本报告...\n');
  
  const projectRoot = process.cwd();
  const packageJson = readJsonFile(path.join(projectRoot, 'package.json'));
  const manifestJson = readJsonFile(path.join(projectRoot, 'manifest.json'));
  
  if (!packageJson || !manifestJson) {
    return false;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    files: {
      'package.json': {
        version: packageJson.version,
        valid: isValidVersion(packageJson.version)
      },
      'manifest.json': {
        version: manifestJson.version,
        valid: isValidVersion(manifestJson.version)
      }
    },
    consistent: packageJson.version === manifestJson.version,
    recommendations: []
  };
  
  // 添加建议
  if (!report.consistent) {
    report.recommendations.push('统一所有文件中的版本号');
  }
  
  if (!report.files['package.json'].valid) {
    report.recommendations.push('修复package.json中的版本号格式');
  }
  
  if (!report.files['manifest.json'].valid) {
    report.recommendations.push('修复manifest.json中的版本号格式');
  }
  
  // 保存报告
  const reportPath = path.join(projectRoot, 'version-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  success(`版本报告已生成: ${reportPath}`);
  
  return true;
}

// 主函数
function main() {
  console.log('\n🔍 语影翻译插件版本检查工具\n');
  
  let allPassed = true;
  
  // 执行检查
  allPassed &= checkVersionFormat();
  allPassed &= checkVersionConsistency();
  allPassed &= checkGitTags();
  allPassed &= generateVersionReport();
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    success('🎉 所有版本检查通过！');
    process.exit(0);
  } else {
    error('❌ 版本检查发现问题');
    console.log('\n💡 建议:');
    console.log('   1. 确保所有文件中的版本号一致');
    console.log('   2. 使用语义化版本控制格式');
    console.log('   3. 运行 npm run release 自动更新版本');
    process.exit(1);
  }
}

// 处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('\n🔍 语影翻译插件版本检查工具');
    console.log('\n用法:');
    console.log('  node scripts/check-version.js');
    console.log('\n选项:');
    console.log('  --help, -h    显示帮助信息');
    console.log('\n功能:');
    console.log('  - 检查版本号格式是否符合语义化版本控制');
    console.log('  - 验证package.json和manifest.json版本一致性');
    console.log('  - 检查Git标签状态');
    console.log('  - 生成版本报告');
    console.log('');
    process.exit(0);
  }
  
  main();
}

module.exports = {
  checkVersionConsistency,
  checkVersionFormat,
  checkGitTags,
  generateVersionReport,
  isValidVersion,
  compareVersions
};