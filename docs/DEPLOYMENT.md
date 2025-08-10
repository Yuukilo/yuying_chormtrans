# 部署指南 (Deployment Guide)

本文档详细说明了如何将语影翻译插件部署到GitHub和各个浏览器扩展商店。

## 📋 目录

- [GitHub部署](#github部署)
- [Chrome Web Store部署](#chrome-web-store部署)
- [Edge Add-ons部署](#edge-add-ons部署)
- [Firefox Add-ons部署](#firefox-add-ons部署)
- [自动化部署](#自动化部署)
- [版本管理](#版本管理)
- [故障排除](#故障排除)

## 🚀 GitHub部署

### 1. 创建GitHub仓库

```bash
# 初始化Git仓库
git init

# 添加远程仓库
git remote add origin https://github.com/yuying-translation/browser-extension.git

# 添加所有文件
git add .

# 提交初始版本
git commit -m "feat: initial commit - yuying translation extension v1.0.0"

# 推送到GitHub
git push -u origin main
```

### 2. 配置GitHub Actions

项目已包含CI/CD配置文件 `.github/workflows/ci.yml`，支持：

- ✅ 自动化测试和代码检查
- ✅ 自动构建扩展包
- ✅ 安全性扫描
- ✅ 发布时自动创建Release

### 3. 创建Release

#### 方法一：使用发布脚本（推荐）

```bash
# 运行发布脚本
npm run release

# 推送标签到GitHub
git push origin main --tags
```

#### 方法二：手动创建

1. 在GitHub仓库页面点击 "Releases"
2. 点击 "Create a new release"
3. 选择或创建标签（如 `v1.0.0`）
4. 填写发布说明
5. 上传构建好的扩展包
6. 发布Release

### 4. 配置仓库设置

#### 分支保护规则

在 `Settings > Branches` 中为 `main` 分支设置保护规则：

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

#### 安全设置

在 `Settings > Security` 中启用：

- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Code scanning alerts

## 🌐 Chrome Web Store部署

### 1. 准备工作

- 注册 [Chrome Web Store开发者账户](https://chrome.google.com/webstore/devconsole/)
- 支付一次性注册费用（$5）
- 准备应用图标和截图

### 2. 构建扩展包

```bash
# 构建生产版本
npm run build

# 创建扩展包
npm run package
```

### 3. 上传到Chrome Web Store

1. 登录 [Chrome Web Store开发者控制台](https://chrome.google.com/webstore/devconsole/)
2. 点击 "新增项目"
3. 上传构建好的 `.zip` 文件
4. 填写应用信息：
   - 应用名称：语影翻译插件
   - 简短描述：智能网页翻译工具，支持多AI服务
   - 详细描述：参考 `README.md` 中的功能介绍
   - 类别：生产力工具
   - 语言：中文（简体）
5. 上传图标和截图
6. 设置隐私政策（如需要）
7. 提交审核

### 4. 审核和发布

- 审核时间：通常1-3个工作日
- 审核通过后自动发布
- 可以设置分阶段发布（推荐）

## 🔷 Edge Add-ons部署

### 1. 注册开发者账户

- 访问 [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home)
- 使用Microsoft账户登录
- 完成开发者注册（免费）

### 2. 上传扩展

1. 登录 [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. 点击 "新建扩展"
3. 上传扩展包
4. 填写扩展信息
5. 提交审核

## 🦊 Firefox Add-ons部署

### 1. 注册开发者账户

- 访问 [Firefox Add-ons](https://addons.mozilla.org/)
- 创建Firefox账户
- 完成开发者注册

### 2. 适配Firefox

由于Firefox使用Manifest V2，需要进行适配：

```bash
# 创建Firefox版本
npm run build:firefox
```

### 3. 上传到AMO

1. 登录 [AMO开发者中心](https://addons.mozilla.org/developers/)
2. 点击 "Submit a New Add-on"
3. 上传适配后的扩展包
4. 填写扩展信息
5. 提交审核

## 🤖 自动化部署

### GitHub Actions自动发布

项目配置了自动化CI/CD流程：

```yaml
# 当创建Release时自动触发
on:
  release:
    types: [published]

# 自动构建和上传扩展包
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Build and package
        run: |
          npm run build
          npm run package
      - name: Upload to release
        # 自动上传到GitHub Release
```

### 扩展商店自动发布

可以配置自动发布到各个扩展商店：

```bash
# 安装发布工具
npm install -g chrome-webstore-upload-cli
npm install -g web-ext

# 配置API密钥（在GitHub Secrets中）
# CHROME_EXTENSION_ID
# CHROME_CLIENT_ID
# CHROME_CLIENT_SECRET
# CHROME_REFRESH_TOKEN
```

## 📊 版本管理

### 语义化版本控制

项目遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH` (如 `1.0.0`)
- **MAJOR**: 不兼容的API修改
- **MINOR**: 向下兼容的功能新增
- **PATCH**: 向下兼容的问题修正

### 发布流程

```bash
# 1. 开发新功能
git checkout -b feature/new-feature
# ... 开发代码 ...
git commit -m "feat: add new feature"

# 2. 合并到主分支
git checkout main
git merge feature/new-feature

# 3. 运行发布脚本
npm run release

# 4. 推送到GitHub
git push origin main --tags

# 5. 在GitHub上创建Release
# 6. 自动触发CI/CD流程
```

### 版本分支策略

- `main`: 生产环境分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支
- `release/*`: 发布分支

## 🔧 故障排除

### 常见问题

#### 1. 构建失败

```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查代码质量
npm run lint
npm run type-check
```

#### 2. 扩展包过大

```bash
# 分析包大小
npm run analyze

# 优化构建
npm run build:prod
```

#### 3. 审核被拒

常见拒绝原因：
- 权限过多
- 缺少隐私政策
- 功能描述不清
- 图标不符合规范

解决方案：
- 检查 `manifest.json` 权限
- 添加隐私政策
- 完善应用描述
- 更新图标和截图

#### 4. API配额限制

```javascript
// 在代码中添加速率限制
const rateLimiter = {
  requests: 0,
  resetTime: Date.now() + 60000,
  
  async checkLimit() {
    if (Date.now() > this.resetTime) {
      this.requests = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    if (this.requests >= 100) {
      throw new Error('API rate limit exceeded');
    }
    
    this.requests++;
  }
};
```

### 监控和日志

#### 错误监控

```javascript
// 添加错误监控
window.addEventListener('error', (event) => {
  console.error('Extension error:', event.error);
  // 发送到监控服务
});
```

#### 性能监控

```javascript
// 监控性能指标
const performanceMonitor = {
  startTime: performance.now(),
  
  measure(name) {
    const duration = performance.now() - this.startTime;
    console.log(`${name} took ${duration}ms`);
  }
};
```

## 📞 支持和反馈

- **GitHub Issues**: [报告问题](https://github.com/yuying-translation/browser-extension/issues)
- **讨论区**: [GitHub Discussions](https://github.com/yuying-translation/browser-extension/discussions)
- **邮箱**: support@yuying-translation.com
- **文档**: [在线文档](https://yuying-translation.github.io/browser-extension/)

---

**祝您部署顺利！** 🚀✨