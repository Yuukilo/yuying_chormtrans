# 贡献指南 (Contributing Guide)

感谢您对语影翻译插件项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、测试、反馈和建议。

## 📋 目录

- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request流程](#pull-request流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [社区准则](#社区准则)

## 🤝 如何贡献

### 贡献类型

我们欢迎以下类型的贡献：

- 🐛 **Bug修复**: 修复现有功能中的问题
- ✨ **新功能**: 添加新的翻译功能或改进
- 📚 **文档**: 改进文档、添加示例或教程
- 🧪 **测试**: 添加或改进测试用例
- 🎨 **UI/UX**: 改进用户界面和用户体验
- 🔧 **工具**: 改进构建工具、CI/CD流程等
- 🌐 **国际化**: 添加新语言支持或改进翻译
- 📈 **性能**: 优化性能和资源使用

### 贡献流程

1. **Fork仓库** - 点击GitHub页面右上角的Fork按钮
2. **克隆仓库** - 将Fork的仓库克隆到本地
3. **创建分支** - 为您的贡献创建一个新分支
4. **开发代码** - 在新分支上进行开发
5. **测试代码** - 确保代码通过所有测试
6. **提交更改** - 遵循提交规范提交代码
7. **推送分支** - 将分支推送到您的Fork仓库
8. **创建PR** - 在GitHub上创建Pull Request

## 🛠️ 开发环境设置

### 系统要求

- **Node.js**: 16.x 或更高版本
- **npm**: 7.x 或更高版本
- **Git**: 2.x 或更高版本
- **浏览器**: Chrome/Edge 88+ 或 Firefox 78+

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/browser-extension.git
cd browser-extension

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器中加载扩展
# Chrome: 打开 chrome://extensions/
# 启用开发者模式，点击"加载已解压的扩展程序"
# 选择项目根目录
```

### 开发工具

```bash
# 代码检查
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm test

# 构建生产版本
npm run build

# 打包扩展
npm run package
```

### 项目结构

```
browser-extension/
├── js/                 # 核心JavaScript文件
│   ├── background.js   # 后台脚本
│   ├── content.js      # 内容脚本
│   ├── popup.js        # 弹窗脚本
│   └── utils/          # 工具函数
├── css/                # 样式文件
├── icons/              # 图标资源
├── _locales/           # 国际化文件
├── docs/               # 文档
├── scripts/            # 构建脚本
├── manifest.json       # 扩展清单
└── popup.html          # 弹窗页面
```

## 📝 代码规范

### JavaScript规范

我们使用ESLint和Prettier来保持代码一致性：

```javascript
// ✅ 推荐写法
const translationService = {
  async translateText(text, options = {}) {
    try {
      const result = await this.callAPI(text, options);
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }
};

// ❌ 不推荐写法
function translate(text) {
  return new Promise((resolve, reject) => {
    // 避免不必要的Promise包装
  });
}
```

### 命名规范

- **变量和函数**: 使用camelCase
- **常量**: 使用UPPER_SNAKE_CASE
- **类**: 使用PascalCase
- **文件**: 使用kebab-case

```javascript
// 变量和函数
const userName = 'user';
function getUserInfo() {}

// 常量
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;

// 类
class TranslationManager {}

// 文件
// translation-service.js
// user-settings.js
```

### 注释规范

```javascript
/**
 * 翻译指定文本
 * @param {string} text - 要翻译的文本
 * @param {Object} options - 翻译选项
 * @param {string} options.from - 源语言
 * @param {string} options.to - 目标语言
 * @param {string} options.service - 翻译服务
 * @returns {Promise<string>} 翻译结果
 */
async function translateText(text, options) {
  // 实现代码
}
```

## 📋 提交规范

我们使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

### 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具、依赖更新等
- `ci`: CI/CD相关
- `revert`: 回滚提交

### 提交示例

```bash
# 新功能
git commit -m "feat(translation): add support for DeepSeek API"

# Bug修复
git commit -m "fix(popup): resolve settings not saving issue"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 重大变更
git commit -m "feat!: migrate to Manifest V3

BREAKING CHANGE: requires Chrome 88+ due to Manifest V3"
```

## 🔄 Pull Request流程

### 创建PR前的检查清单

- [ ] 代码通过所有测试 (`npm test`)
- [ ] 代码通过Lint检查 (`npm run lint`)
- [ ] 代码通过类型检查 (`npm run type-check`)
- [ ] 更新了相关文档
- [ ] 添加了必要的测试用例
- [ ] 遵循了提交规范
- [ ] 分支基于最新的main分支

### PR模板

创建PR时，请使用以下模板：

```markdown
## 📝 变更描述

简要描述此PR的变更内容。

## 🔗 相关Issue

- Fixes #123
- Related to #456

## 📋 变更类型

- [ ] Bug修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 🧪 测试

描述如何测试这些变更：

1. 步骤1
2. 步骤2
3. 预期结果

## 📸 截图（如适用）

添加截图来展示UI变更。

## ✅ 检查清单

- [ ] 代码通过所有测试
- [ ] 代码通过Lint检查
- [ ] 更新了文档
- [ ] 添加了测试用例
- [ ] 遵循了代码规范
```

### 代码审查

所有PR都需要经过代码审查：

- **自动检查**: GitHub Actions会自动运行测试和检查
- **人工审查**: 至少需要一位维护者的批准
- **反馈处理**: 及时回应审查意见并进行修改

## 🐛 问题报告

### 报告Bug

使用[Bug报告模板](https://github.com/yuying-translation/browser-extension/issues/new?template=bug_report.md)：

```markdown
## 🐛 Bug描述

清晰简洁地描述Bug。

## 🔄 复现步骤

1. 打开扩展
2. 点击设置
3. 看到错误

## 🎯 预期行为

描述您期望发生的行为。

## 📸 截图

如果适用，添加截图来帮助解释问题。

## 🖥️ 环境信息

- 操作系统: [如 Windows 10]
- 浏览器: [如 Chrome 91.0.4472.124]
- 扩展版本: [如 1.0.0]

## 📋 附加信息

添加任何其他相关信息。
```

### 安全问题

如果发现安全漏洞，请**不要**在公开Issue中报告，而是：

1. 发送邮件到 security@yuying-translation.com
2. 包含详细的漏洞描述和复现步骤
3. 我们会在24小时内回复

## ✨ 功能请求

使用[功能请求模板](https://github.com/yuying-translation/browser-extension/issues/new?template=feature_request.md)：

```markdown
## 🚀 功能描述

清晰简洁地描述您想要的功能。

## 💡 动机

解释为什么这个功能对您或其他用户有用。

## 📝 详细设计

描述您希望这个功能如何工作。

## 🎯 替代方案

描述您考虑过的任何替代解决方案。

## 📋 附加信息

添加任何其他相关信息或截图。
```

## 🤝 社区准则

### 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境：

- **尊重**: 尊重不同的观点和经验
- **包容**: 欢迎所有背景的贡献者
- **协作**: 以建设性的方式进行讨论
- **专业**: 保持专业和礼貌的交流

### 不当行为

以下行为是不被接受的：

- 使用性别化语言或图像
- 人身攻击或侮辱性评论
- 骚扰行为（公开或私下）
- 发布他人的私人信息
- 其他不专业的行为

### 举报

如果遇到不当行为，请联系项目维护者：

- 邮箱: conduct@yuying-translation.com
- 我们会认真对待所有举报
- 所有举报都会被保密处理

## 🏆 贡献者认可

我们重视每一位贡献者的努力：

- **贡献者列表**: 在README中展示所有贡献者
- **发布说明**: 在版本发布时感谢贡献者
- **特殊徽章**: 为重要贡献者提供特殊认可
- **社区活动**: 定期举办贡献者聚会

## 📞 获取帮助

如果您需要帮助或有疑问：

- **GitHub Discussions**: [讨论区](https://github.com/yuying-translation/browser-extension/discussions)
- **Discord**: [加入我们的Discord服务器](https://discord.gg/yuying-translation)
- **邮箱**: help@yuying-translation.com
- **文档**: [开发者文档](https://yuying-translation.github.io/browser-extension/)

## 🙏 致谢

感谢所有为这个项目做出贡献的人！您的努力让语影翻译插件变得更好。

---

**再次感谢您的贡献！** 🎉✨