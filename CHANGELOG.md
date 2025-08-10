# 变更日志

本文档记录了语影翻译插件的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划新增
- 支持更多翻译引擎
- 添加翻译历史记录功能
- 优化OCR识别准确率
- 支持批量翻译

## [1.0.0] - 2024-01-15

### 新增
- 🎉 首个正式版本发布
- 🌐 多翻译引擎支持（百度翻译、有道翻译、Google翻译）
- 🖼️ OCR图片翻译功能
- 🎯 智能选词翻译
- 🔄 实时翻译切换
- 📊 使用统计和数据分析
- 🎨 现代化用户界面设计
- ⚡ 高性能翻译引擎
- 🔒 本地缓存和隐私保护
- 🛠️ 完整的开发和构建工具链

### 技术特性
- Webpack构建系统
- ESLint代码质量检查
- Prettier代码格式化
- GitHub Actions自动化部署
- 语义化版本控制
- 完整的文档体系

### 文件结构
- `js/background.js` - 后台服务脚本
- `js/content.js` - 内容脚本，处理网页翻译
- `js/popup.js` - 弹窗界面脚本
- `js/translation-service.js` - 翻译服务核心
- `js/cache-manager.js` - 缓存管理系统
- `css/` - 样式文件目录
- `images/` - 图片资源目录

### 支持的翻译服务
- 百度翻译 API
- 有道翻译 API
- Google翻译 API
- OCR图片识别翻译

### 核心功能
- **选词翻译**：选中网页文本即可翻译
- **图片翻译**：右键图片进行OCR翻译
- **翻译切换**：一键开启/关闭翻译功能
- **多语言支持**：支持中英文等多种语言互译
- **缓存机制**：智能缓存提升翻译速度
- **使用统计**：记录翻译次数和使用情况
- **设置管理**：灵活的API配置和偏好设置

### 开发工具
- **构建系统**：Webpack + Babel
- **代码检查**：ESLint + Prettier
- **版本管理**：语义化版本控制
- **自动化**：GitHub Actions CI/CD
- **打包工具**：自动化扩展包生成

### 文档
- 完整的README文档
- GitHub部署指南
- Chrome扩展发布指南
- 版本管理指南
- API使用说明

---

## 版本说明

### 版本号格式

本项目使用语义化版本控制 (SemVer)：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的API修改
- **MINOR**：向下兼容的功能性新增
- **PATCH**：向下兼容的问题修正

### 变更类型

- **新增 (Added)**：新功能
- **修复 (Fixed)**：bug修复
- **变更 (Changed)**：现有功能的变更
- **弃用 (Deprecated)**：即将移除的功能
- **移除 (Removed)**：已移除的功能
- **安全 (Security)**：安全相关的修复

### 发布周期

- **主版本 (Major)**：重大功能更新或架构变更
- **次版本 (Minor)**：新功能添加，每月发布
- **修订版本 (Patch)**：bug修复，按需发布

---

## 贡献指南

如果您想为本项目贡献代码或报告问题：

1. 查看 [GitHub Issues](https://github.com/yuying-translation/browser-extension/issues)
2. 阅读 [贡献指南](CONTRIBUTING.md)
3. 提交 Pull Request

---

## 支持

- 📧 邮箱：support@yuying-translation.com
- 🐛 [报告Bug](https://github.com/yuying-translation/browser-extension/issues)
- 💬 [功能建议](https://github.com/yuying-translation/browser-extension/discussions)

---

*最后更新：2024年1月15日*