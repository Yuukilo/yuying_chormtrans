# 🚀 语影翻译插件 GitHub 部署指南

## 📋 部署前准备

### 1. 安装 Git

**Windows 用户:**
1. 访问 [Git官网下载页面](https://git-scm.com/download/win)
2. 下载 Git for Windows 安装包
3. 运行安装程序，使用默认设置即可
4. 安装完成后，重启命令行或IDE

**验证安装:**
```bash
git --version
```

### 2. 配置 Git 用户信息

```bash
git config --global user.name "您的GitHub用户名"
git config --global user.email "您的GitHub邮箱"
```

### 3. 创建 GitHub 仓库

1. 访问 [GitHub新建仓库页面](https://github.com/new)
2. 仓库名建议: `yuying-translation-extension`
3. 设置为公开仓库 (Public)
4. **不要**勾选初始化 README、.gitignore 或 LICENSE
5. 点击 "Create repository"

## 🔧 自动化部署

### 方法一: 使用部署脚本 (推荐)

```bash
node scripts/deploy-to-github.js
```

脚本会自动完成:
- ✅ 检查环境配置
- ✅ 初始化 Git 仓库
- ✅ 添加远程仓库
- ✅ 构建项目
- ✅ 提交代码
- ✅ 推送到 GitHub
- ✅ 创建版本标签
- ✅ 打包扩展

### 方法二: 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤:

#### 1. 初始化 Git 仓库
```bash
git init
git branch -M main
```

#### 2. 添加远程仓库
```bash
git remote add origin https://github.com/您的用户名/yuying-translation-extension.git
```

#### 3. 构建项目
```bash
npm install
npm run build
```

#### 4. 提交代码
```bash
git add .
git commit -m "feat: 语影翻译插件 v1.0.0 - 初始版本"
```

#### 5. 推送到 GitHub
```bash
git push -u origin main
```

#### 6. 创建版本标签
```bash
git tag v1.0.0
git push origin v1.0.0
```

#### 7. 打包扩展
```bash
node scripts/build-package.js
```

## 📦 发布 Release

### 1. 在 GitHub 上创建 Release

1. 访问您的仓库页面
2. 点击右侧的 "Releases"
3. 点击 "Create a new release"
4. 选择标签: `v1.0.0`
5. 填写发布标题: `语影翻译插件 v1.0.0`
6. 填写发布说明:

```markdown
## 🎉 语影翻译插件 v1.0.0

### ✨ 主要功能
- 🌐 多语言网页翻译
- 🖼️ OCR 图片翻译
- ⚡ 智能缓存优化
- 🎨 用户友好界面
- 🔧 多API提供商支持

### 📥 安装方法
1. 下载 `yuying-translation-extension.crx` 文件
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 开启"开发者模式"
5. 拖拽 .crx 文件到页面中安装

### 🔧 支持的翻译服务
- DeepSeek API
- OpenAI API
- 其他兼容 OpenAI 格式的 API

### 📋 系统要求
- Chrome 88+ 或其他 Chromium 内核浏览器
- 有效的 API 密钥
```

7. 上传打包好的 `.crx` 文件
8. 点击 "Publish release"

### 2. 自动化 Release (可选)

项目已配置 GitHub Actions，当推送新标签时会自动:
- 构建项目
- 打包扩展
- 创建 Release
- 上传构建产物

## 🏪 提交到 Chrome Web Store

### 1. 准备材料

- ✅ 打包好的 `.zip` 文件 (不是 .crx)
- ✅ 应用图标 (128x128px)
- ✅ 应用截图 (1280x800px 或 640x400px)
- ✅ 应用描述
- ✅ 隐私政策 (如果收集用户数据)

### 2. 提交流程

1. 访问 [Chrome Web Store 开发者控制台](https://chrome.google.com/webstore/devconsole/)
2. 支付一次性开发者注册费 ($5)
3. 点击 "新增项目"
4. 上传 `.zip` 文件
5. 填写应用信息:
   - 名称: 语影翻译插件
   - 描述: 智能网页翻译工具，支持文本和图片翻译
   - 类别: 生产力工具
   - 语言: 中文 (简体)
6. 上传图标和截图
7. 设置隐私设置
8. 提交审核

### 3. 审核时间

- 首次提交: 通常 1-3 个工作日
- 更新版本: 通常几小时到 1 天

## 🔄 版本更新流程

### 1. 更新版本号

编辑 `manifest.json`:
```json
{
  "version": "1.0.1"
}
```

编辑 `package.json`:
```json
{
  "version": "1.0.1"
}
```

### 2. 提交更新

```bash
git add .
git commit -m "feat: 更新到 v1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### 3. 创建新 Release

重复上述 Release 创建流程

### 4. 更新 Chrome Web Store

1. 构建新版本
2. 在开发者控制台上传新的 `.zip` 文件
3. 更新版本说明
4. 提交审核

## 🛠️ 故障排除

### Git 相关问题

**问题**: `git: command not found`
**解决**: 重新安装 Git 并重启命令行

**问题**: 推送被拒绝
**解决**: 
```bash
git pull origin main --rebase
git push origin main
```

### 构建问题

**问题**: `npm install` 失败
**解决**: 
```bash
npm cache clean --force
npm install
```

**问题**: 构建产物缺失
**解决**: 
```bash
npm run clean
npm run build
```

### Chrome 扩展问题

**问题**: 扩展无法加载
**解决**: 检查 `manifest.json` 语法和权限配置

**问题**: API 调用失败
**解决**: 检查 API 密钥和网络连接

## 📞 获取帮助

- 📖 查看项目文档: `docs/` 目录
- 🐛 报告问题: GitHub Issues
- 💬 讨论交流: GitHub Discussions
- 📧 联系开发者: 通过 GitHub

## 🎯 下一步计划

- [ ] 添加更多翻译服务支持
- [ ] 优化翻译准确性
- [ ] 增加批量翻译功能
- [ ] 支持更多浏览器
- [ ] 添加翻译历史记录

---

🎉 **恭喜！您已成功部署语影翻译插件到 GitHub！**

现在您可以:
- ✅ 在 GitHub 上管理代码版本
- ✅ 发布 Release 供用户下载
- ✅ 提交到 Chrome Web Store
- ✅ 接受社区贡献和反馈

祝您的扩展获得成功！🚀