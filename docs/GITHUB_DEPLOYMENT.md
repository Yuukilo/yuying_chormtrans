# GitHub 部署指南

本指南将帮助您将语影翻译插件项目部署到GitHub，并设置自动化的构建和发布流程。

## 目录

- [前置准备](#前置准备)
- [创建GitHub仓库](#创建github仓库)
- [初始化Git仓库](#初始化git仓库)
- [推送代码到GitHub](#推送代码到github)
- [设置GitHub Actions](#设置github-actions)
- [创建Release发布](#创建release发布)
- [Chrome Web Store发布](#chrome-web-store发布)

## 前置准备

### 1. 安装必要工具

确保您已安装以下工具：

```bash
# 检查Git版本
git --version

# 检查Node.js版本
node --version
npm --version
```

### 2. GitHub账户设置

- 确保您有GitHub账户
- 配置SSH密钥或Personal Access Token
- 安装GitHub CLI（可选）

```bash
# 配置Git用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 创建GitHub仓库

### 方法1：通过GitHub网站

1. 登录GitHub
2. 点击右上角的 "+" 按钮
3. 选择 "New repository"
4. 填写仓库信息：
   - **Repository name**: `yuying-translation-extension`
   - **Description**: `语影翻译插件 - 智能网页翻译Chrome扩展`
   - **Visibility**: Public（推荐）或Private
   - **Initialize**: 不要勾选任何初始化选项

### 方法2：通过GitHub CLI

```bash
# 创建公开仓库
gh repo create yuying-translation-extension --public --description "语影翻译插件 - 智能网页翻译Chrome扩展"

# 或创建私有仓库
gh repo create yuying-translation-extension --private --description "语影翻译插件 - 智能网页翻译Chrome扩展"
```

## 初始化Git仓库

在项目根目录执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/yuying-translation-extension.git

# 或使用SSH（推荐）
git remote add origin git@github.com:YOUR_USERNAME/yuying-translation-extension.git
```

## 推送代码到GitHub

### 1. 检查文件状态

```bash
# 查看文件状态
git status

# 查看.gitignore是否正确配置
cat .gitignore
```

### 2. 添加和提交文件

```bash
# 添加所有文件
git add .

# 创建初始提交
git commit -m "feat: 初始化语影翻译插件v1.0

- 完整的Chrome扩展功能
- 支持多种翻译API
- 智能文本识别和翻译
- OCR图片翻译功能
- 完善的设置和缓存系统"
```

### 3. 推送到GitHub

```bash
# 创建并切换到main分支
git branch -M main

# 推送到远程仓库
git push -u origin main
```

## 设置分支保护

为了确保代码质量，建议设置分支保护规则：

1. 进入GitHub仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单选择 "Branches"
4. 点击 "Add rule" 添加保护规则
5. 配置以下选项：
   - **Branch name pattern**: `main`
   - **Require pull request reviews before merging**: ✓
   - **Require status checks to pass before merging**: ✓
   - **Require branches to be up to date before merging**: ✓

## 创建开发工作流

### 1. 创建开发分支

```bash
# 创建并切换到开发分支
git checkout -b develop
git push -u origin develop
```

### 2. 功能开发流程

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发完成后
git add .
git commit -m "feat: 添加新功能"
git push -u origin feature/new-feature

# 在GitHub上创建Pull Request
# 合并后删除功能分支
git checkout develop
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

## 版本标签管理

### 1. 创建版本标签

```bash
# 创建带注释的标签
git tag -a v1.0.0 -m "Release version 1.0.0

新功能:
- 完整的翻译功能
- OCR图片翻译
- 多API支持

修复:
- 修复了所有已知问题

改进:
- 优化了性能和用户体验"

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

### 2. 版本号规范

遵循语义化版本控制（Semantic Versioning）：

- **主版本号（Major）**: 不兼容的API修改
- **次版本号（Minor）**: 向下兼容的功能性新增
- **修订号（Patch）**: 向下兼容的问题修正

示例：
- `v1.0.0` - 首个正式版本
- `v1.1.0` - 添加新功能
- `v1.1.1` - 修复bug
- `v2.0.0` - 重大更新

## 自动化部署脚本

创建部署脚本简化发布流程：

```bash
# 使用部署脚本
npm run release

# 或手动指定版本
npm run release -- --version 1.1.0
```

## 故障排除

### 常见问题

1. **推送被拒绝**
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

2. **文件过大**
   ```bash
   # 检查大文件
git ls-files --others --ignored --exclude-standard
   
   # 使用Git LFS
   git lfs track "*.crx"
   git add .gitattributes
   ```

3. **合并冲突**
   ```bash
   # 解决冲突后
   git add .
   git commit -m "resolve: 解决合并冲突"
   ```

## 最佳实践

1. **提交信息规范**
   - 使用约定式提交（Conventional Commits）
   - 格式：`type(scope): description`
   - 类型：feat, fix, docs, style, refactor, test, chore

2. **分支管理**
   - `main`: 生产环境代码
   - `develop`: 开发环境代码
   - `feature/*`: 功能开发分支
   - `hotfix/*`: 紧急修复分支

3. **代码审查**
   - 所有代码变更都通过Pull Request
   - 至少一人审查代码
   - 通过所有自动化测试

4. **文档维护**
   - 及时更新README.md
   - 维护CHANGELOG.md
   - 编写详细的API文档

## 下一步

- [设置GitHub Actions自动化](./GITHUB_ACTIONS.md)
- [创建Release发布](./RELEASE_GUIDE.md)
- [Chrome Web Store发布指南](./CHROME_STORE_GUIDE.md)