# Chrome扩展发布指南

本指南详细说明如何在GitHub上发布和管理语影翻译插件的版本，以及如何将扩展发布到Chrome Web Store。

## 目录

- [发布前准备](#发布前准备)
- [GitHub Release发布](#github-release发布)
- [Chrome Web Store发布](#chrome-web-store发布)
- [版本管理策略](#版本管理策略)
- [自动化发布流程](#自动化发布流程)
- [发布后维护](#发布后维护)

## 发布前准备

### 1. 代码质量检查

在发布前确保代码质量：

```bash
# 运行所有检查
npm run lint
npm run check
npm test
npm run build
```

### 2. 版本号更新

更新以下文件中的版本号：

- `package.json`
- `manifest.json`
- `README.md`
- `CHANGELOG.md`

```bash
# 使用npm version命令自动更新
npm version patch  # 修复版本 (1.0.0 -> 1.0.1)
npm version minor  # 功能版本 (1.0.0 -> 1.1.0)
npm version major  # 主要版本 (1.0.0 -> 2.0.0)
```

### 3. 更新变更日志

在 `CHANGELOG.md` 中记录本次发布的变更：

```markdown
## [1.1.0] - 2024-01-15

### 新增
- 添加了OCR图片翻译功能
- 支持新的翻译API提供商

### 修复
- 修复了在某些网站上翻译失效的问题
- 优化了内存使用

### 改进
- 提升了翻译速度
- 改善了用户界面
```

## GitHub Release发布

### 1. 自动发布（推荐）

使用Git标签触发自动发布：

```bash
# 创建并推送标签
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

GitHub Actions将自动：
- 构建扩展
- 运行测试
- 创建Release
- 上传扩展包

### 2. 手动发布

如果需要手动创建Release：

1. **构建扩展包**
   ```bash
   npm run build
   cd dist
   zip -r ../yuying-translation-extension-v1.1.0.zip .
   ```

2. **创建GitHub Release**
   - 访问GitHub仓库页面
   - 点击 "Releases" → "Create a new release"
   - 填写发布信息：
     - **Tag version**: `v1.1.0`
     - **Release title**: `语影翻译插件 v1.1.0`
     - **Description**: 从CHANGELOG.md复制相关内容
   - 上传扩展包文件
   - 点击 "Publish release"

### 3. Release模板

使用以下模板创建Release描述：

```markdown
## 🎉 语影翻译插件 v1.1.0 发布

### 📦 安装方法

1. 下载下方的扩展包文件
2. 解压到本地文件夹
3. 打开Chrome浏览器，进入 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"，选择解压后的文件夹

### 🆕 新功能

- ✨ 添加了OCR图片翻译功能
- 🔧 支持新的翻译API提供商
- 🎨 改进了用户界面设计

### 🐛 问题修复

- 🔧 修复了在某些网站上翻译失效的问题
- ⚡ 优化了内存使用和性能
- 🛠️ 修复了设置页面的显示问题

### 📋 系统要求

- Chrome 88+ 或其他基于Chromium的浏览器
- 需要网络连接以使用翻译API

### 🔗 相关链接

- [使用文档](./docs/USER_GUIDE.md)
- [开发文档](./docs/DEVELOPMENT.md)
- [问题反馈](https://github.com/username/yuying-translation-extension/issues)

---

**完整更新日志**: https://github.com/username/yuying-translation-extension/compare/v1.0.0...v1.1.0
```

## Chrome Web Store发布

### 1. 准备发布包

为Chrome Web Store准备优化的发布包：

```bash
# 构建生产版本
npm run build:production

# 创建Web Store发布包
npm run package:webstore
```

### 2. Chrome Web Store开发者控制台

1. **访问开发者控制台**
   - 前往 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - 使用Google账户登录

2. **创建新应用**（首次发布）
   - 点击 "Add new item"
   - 上传扩展包ZIP文件
   - 填写应用信息

3. **更新现有应用**
   - 选择现有应用
   - 上传新版本的ZIP文件
   - 更新应用描述和截图

### 3. 应用商店信息

**应用名称**: 语影翻译插件 - 智能网页翻译

**简短描述**: 智能网页翻译工具，支持多种翻译API和OCR图片翻译

**详细描述**:
```
🌐 语影翻译插件是一款功能强大的Chrome扩展，为您提供智能、快速的网页翻译服务。

✨ 主要功能：
• 🔄 一键翻译整个网页或选中文本
• 🖼️ OCR图片翻译，识别图片中的文字并翻译
• 🎯 支持多种翻译API（DeepSeek、OpenAI、Google等）
• ⚡ 智能缓存，提升翻译速度
• 🎨 美观的悬浮翻译框
• ⚙️ 丰富的自定义设置

🚀 使用方法：
1. 安装扩展后，点击工具栏图标进行设置
2. 配置您的翻译API密钥
3. 在任意网页上选择文本即可翻译
4. 使用快捷键快速开启/关闭翻译功能

🔒 隐私保护：
• 所有翻译请求直接发送到您选择的API服务
• 不收集或存储您的个人数据
• 本地缓存仅存储在您的浏览器中

📞 支持与反馈：
如有问题或建议，请访问我们的GitHub仓库提交反馈。
```

**类别**: 生产力工具

**语言**: 中文（简体）、English

### 4. 截图和图标

准备以下素材：

- **应用图标**: 128x128px PNG格式
- **小图标**: 16x16px, 48x48px PNG格式
- **截图**: 1280x800px 或 640x400px
- **宣传图片**: 440x280px（可选）

### 5. 发布流程

1. **上传扩展包**
2. **填写应用信息**
3. **上传图标和截图**
4. **设置定价和分发**（免费）
5. **提交审核**

审核通常需要1-3个工作日。

## 版本管理策略

### 1. 版本号规范

遵循语义化版本控制（SemVer）：

- **主版本号（Major）**: 不兼容的API修改
- **次版本号（Minor）**: 向下兼容的功能性新增
- **修订号（Patch）**: 向下兼容的问题修正

### 2. 分支策略

- `main`: 生产环境代码，对应Chrome Web Store版本
- `develop`: 开发环境代码
- `release/*`: 发布准备分支
- `hotfix/*`: 紧急修复分支

### 3. 发布周期

- **主要版本**: 每6个月发布一次
- **功能版本**: 每月发布一次
- **修复版本**: 根据需要随时发布

## 自动化发布流程

### 1. GitHub Actions工作流

我们的CI/CD流程包括：

```yaml
# 触发条件
on:
  push:
    tags: ['v*']

# 工作流程
jobs:
  - lint-and-test    # 代码质量检查
  - build           # 构建扩展
  - security-scan   # 安全扫描
  - release         # 创建GitHub Release
  - notify          # 发布通知
```

### 2. 发布脚本

使用npm脚本简化发布流程：

```bash
# 发布新版本
npm run release

# 发布预发布版本
npm run release:beta

# 发布修复版本
npm run release:patch
```

### 3. 自动化检查

发布前自动执行：

- ESLint代码检查
- TypeScript类型检查
- 安全漏洞扫描
- 扩展包大小检查
- Manifest文件验证

## 发布后维护

### 1. 监控和反馈

- 监控GitHub Issues和Discussions
- 关注Chrome Web Store用户评价
- 收集用户反馈和功能请求

### 2. 性能监控

- 监控扩展性能指标
- 跟踪API使用情况
- 分析用户使用模式

### 3. 安全更新

- 定期更新依赖包
- 修复安全漏洞
- 响应安全报告

### 4. 文档维护

- 更新用户文档
- 维护API文档
- 更新安装指南

## 发布检查清单

### 发布前检查

- [ ] 代码质量检查通过
- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG.md已更新
- [ ] 文档已更新
- [ ] 安全扫描通过
- [ ] 扩展包大小合理

### 发布时检查

- [ ] GitHub Release创建成功
- [ ] 扩展包上传完成
- [ ] Release描述完整
- [ ] 标签创建正确
- [ ] CI/CD流程成功

### 发布后检查

- [ ] 扩展包可正常下载
- [ ] 安装测试成功
- [ ] 功能测试通过
- [ ] 文档链接正确
- [ ] 社区通知发送

## 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理并重新构建
   npm run clean
   npm ci
   npm run build
   ```

2. **扩展包过大**
   ```bash
   # 分析包大小
   npm run analyze
   
   # 优化构建
   npm run build:optimize
   ```

3. **Chrome Web Store审核失败**
   - 检查manifest.json格式
   - 确保没有违禁内容
   - 验证权限声明合理
   - 检查图标和截图质量

4. **版本冲突**
   ```bash
   # 重置版本
   git tag -d v1.1.0
   git push origin :refs/tags/v1.1.0
   
   # 重新创建标签
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

## 最佳实践

1. **版本发布**
   - 始终在发布分支上进行最终测试
   - 使用自动化工具减少人为错误
   - 保持发布节奏的一致性

2. **质量保证**
   - 每次发布前进行完整测试
   - 使用多个浏览器测试兼容性
   - 在不同操作系统上验证功能

3. **用户沟通**
   - 提前通知重大变更
   - 提供详细的更新说明
   - 及时响应用户反馈

4. **安全考虑**
   - 定期更新依赖包
   - 遵循最小权限原则
   - 保护API密钥和敏感信息

---

通过遵循本指南，您可以确保语影翻译插件的发布流程规范、高效且可靠。如有任何问题，请参考相关文档或提交Issue。