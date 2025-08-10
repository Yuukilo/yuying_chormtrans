const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const distPath = path.join(__dirname, '..', 'dist');
const outputPath = path.join(__dirname, '..', 'yuying-translation-extension.zip');

// 删除已存在的zip文件
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

// 创建zip文件
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // 最高压缩级别
});

output.on('close', () => {
  console.log(`\n✅ 扩展打包完成!`);
  console.log(`📦 文件大小: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log(`📁 输出路径: ${outputPath}`);
  console.log(`\n🚀 安装说明:`);
  console.log(`1. 打开 Chrome 浏览器`);
  console.log(`2. 访问 chrome://extensions/`);
  console.log(`3. 开启"开发者模式"`);
  console.log(`4. 点击"加载已解压的扩展程序"`);
  console.log(`5. 选择 dist 文件夹`);
  console.log(`\n或者解压 ${path.basename(outputPath)} 文件后加载解压后的文件夹`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// 添加dist目录下的所有文件
archive.directory(distPath, false);

// 完成打包
archive.finalize();

console.log('🔄 正在打包扩展...');