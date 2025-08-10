# 版本管理指南

## 概述

本文档详细说明了语影翻译插件的版本管理策略、标签创建规范和发布流程。

## 版本号规范

### 语义化版本控制 (SemVer)

我们采用语义化版本控制规范：`MAJOR.MINOR.PATCH`

- **MAJOR（主版本号）**：不兼容的API修改
- **MINOR（次版本号）**：向下兼容的功能性新增
- **PATCH（修订号）**：向下兼容的问题修正

### 版本号示例

```
1.0.0 - 首个正式版本
1.0.1 - 修复bug
1.1.0 - 新增功能
2.0.0 - 重大更新，可能不兼容旧版本
```

### 预发布版本

```
1.0.0-alpha.1 - Alpha版本
1.0.0-beta.1  - Beta版本
1.0.0-rc.1    - Release Candidate版本
```

## Git标签管理

### 标签命名规范

- **发布标签**：`v1.0.0`
- **预发布标签**：`v1.0.0-beta.1`
- **开发标签**：`dev-20240101`

### 创建标签

#### 手动创建标签

```bash
# 创建轻量标签
git tag v1.0.0

# 创建带注释的标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签到远程仓库
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

#### 使用脚本创建标签

```bash
# 自动创建patch版本
npm run release:patch

# 自动创建minor版本
npm run release:minor

# 自动创建major版本
npm run release:major
```

### 标签管理命令

```bash
# 查看所有标签
git tag

# 查看特定标签信息
git show v1.0.0

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0

# 检出特定标签
git checkout v1.0.0
```

## 分支管理策略

### 主要分支

- **main/master**：主分支，包含生产就绪的代码
- **develop**：开发分支，包含最新的开发功能
- **release/x.x.x**：发布分支，准备新版本发布
- **hotfix/x.x.x**：热修复分支，紧急修复生产问题

### 功能分支

- **feature/feature-name**：功能开发分支
- **bugfix/bug-description**：bug修复分支

### 分支工作流

```bash
# 创建功能分支
git checkout -b feature/new-translation-api develop

# 开发完成后合并到develop
git checkout develop
git merge --no-ff feature/new-translation-api

# 创建发布分支
git checkout -b release/1.1.0 develop

# 发布完成后合并到main和develop
git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"

git checkout develop
git merge --no-ff release/1.1.0
```

## 版本发布流程

### 1. 准备发布

```bash
# 确保代码质量
npm run check

# 运行测试
npm test

# 构建项目
npm run build
```

### 2. 更新版本号

#### 手动更新

1. 更新 `manifest.json` 中的版本号
2. 更新 `package.json` 中的版本号
3. 更新 `CHANGELOG.md`

#### 自动更新

```bash
# 使用发布脚本自动更新
npm run release:patch  # 1.0.0 -> 1.0.1
npm run release:minor  # 1.0.0 -> 1.1.0
npm run release:major  # 1.0.0 -> 2.0.0
```

### 3. 创建发布包

```bash
# 构建并打包扩展
npm run package

# 或者只打包（如果已经构建）
npm run zip
```

### 4. 创建Git标签和提交

```bash
# 提交版本更新
git add .
git commit -m "chore: bump version to v1.0.1"

# 创建标签
git tag -a v1.0.1 -m "Release version 1.0.1"

# 推送到远程仓库
git push origin main
git push origin v1.0.1
```

### 5. 创建GitHub Release

1. 访问GitHub仓库的Releases页面
2. 点击"Create a new release"
3. 选择刚创建的标签
4. 填写发布说明
5. 上传扩展包文件
6. 发布Release

## 变更日志管理

### CHANGELOG.md格式

```markdown
# 变更日志

## [1.0.1] - 2024-01-15

### 新增
- 添加新的翻译API支持

### 修复
- 修复popup页面加载统计失败的问题
- 修复background脚本消息验证错误

### 变更
- 优化翻译速度
- 改进用户界面

### 移除
- 移除过时的API调用

## [1.0.0] - 2024-01-01

### 新增
- 初始版本发布
- 基础翻译功能
- 多语言支持
```

### 变更类型

- **新增 (Added)**：新功能
- **修复 (Fixed)**：bug修复
- **变更 (Changed)**：现有功能的变更
- **弃用 (Deprecated)**：即将移除的功能
- **移除 (Removed)**：已移除的功能
- **安全 (Security)**：安全相关的修复

## 版本回滚

### 回滚到特定版本

```bash
# 检出特定版本
git checkout v1.0.0

# 创建回滚分支
git checkout -b rollback-to-v1.0.0

# 如果需要强制回滚main分支
git checkout main
git reset --hard v1.0.0
git push origin main --force
```

### 热修复流程

```bash
# 从main分支创建热修复分支
git checkout -b hotfix/1.0.1 main

# 修复问题
# ...

# 提交修复
git commit -m "fix: critical bug in translation service"

# 合并到main
git checkout main
git merge --no-ff hotfix/1.0.1

# 创建新版本标签
git tag -a v1.0.1 -m "Hotfix version 1.0.1"

# 合并到develop
git checkout develop
git merge --no-ff hotfix/1.0.1

# 推送更新
git push origin main develop
git push origin v1.0.1
```

## 自动化版本管理

### GitHub Actions集成

我们的GitHub Actions工作流会自动：

1. 在推送标签时触发构建
2. 运行代码质量检查
3. 构建扩展包
4. 创建GitHub Release
5. 上传构建产物

### 版本检查脚本

```bash
# 检查版本一致性
node scripts/check-version.js

# 验证标签格式
node scripts/validate-tag.js v1.0.0
```

## 最佳实践

### 版本发布前检查清单

- [ ] 代码质量检查通过 (`npm run check`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 构建成功 (`npm run build`)
- [ ] 版本号已更新（manifest.json, package.json）
- [ ] CHANGELOG.md已更新
- [ ] 功能测试完成
- [ ] 文档已更新
- [ ] 安全扫描通过

### 版本命名建议

1. **保持一致性**：始终使用语义化版本控制
2. **及时更新**：每次发布都要更新版本号
3. **清晰描述**：在标签和Release中提供清晰的变更描述
4. **测试充分**：发布前进行充分测试

### 常见问题

#### Q: 如何处理版本冲突？
A: 使用 `git tag -d` 删除本地标签，`git push origin --delete` 删除远程标签，然后重新创建。

#### Q: 如何查看两个版本之间的差异？
A: 使用 `git diff v1.0.0..v1.1.0` 查看版本间的代码差异。

#### Q: 如何自动化版本号更新？
A: 使用我们提供的 `scripts/release.js` 脚本，它会自动更新所有相关文件的版本号。

## 相关文档

- [GitHub部署指南](./GITHUB_DEPLOYMENT.md)
- [Chrome扩展发布指南](./CHROME_EXTENSION_RELEASE.md)
- [项目README](../README.md)
- [贡献指南](../CONTRIBUTING.md)

---

*最后更新：2024年1月*