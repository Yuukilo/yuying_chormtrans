/**
 * 语影翻译插件 - Prompt管理器
 * 提供优化的翻译prompt模板和智能选择功能
 */

class PromptManager {
  constructor() {
    this.templates = {
      // 通用翻译prompt
      general: `你是一个专业的翻译专家，请将以下文本准确翻译成中文。翻译要求：

1. **准确性**：保持原文的准确含义，不要添加或删除信息
2. **自然性**：使用自然流畅的中文表达，符合中文阅读习惯
3. **专业性**：根据上下文判断专业术语，保持术语的准确性和一致性
4. **语境适应**：根据文本类型调整翻译风格
5. **格式保持**：保持原文的格式结构

请直接输出翻译结果，不要包含解释或其他内容。

原文：{source_text}`,

      // 学术论文翻译prompt
      academic: `你是一个专业的学术翻译专家，请将以下学术文本翻译成中文。翻译要求：

1. **学术严谨性**：保持学术写作的严谨性和准确性
2. **术语一致性**：确保专业术语翻译的准确性和一致性
3. **逻辑清晰**：保持学术论证的逻辑结构
4. **格式规范**：遵循中文学术写作规范
5. **引用保持**：保持原文中的引用格式和编号

请直接输出翻译结果：

{source_text}`,

      // 技术文档翻译prompt
      technical: `你是一个专业的技术文档翻译专家，请将以下技术文档翻译成中文。翻译要求：

1. **技术准确性**：确保技术术语和概念的准确翻译
2. **操作清晰**：保持操作步骤的清晰性和可执行性
3. **代码保持**：保持代码片段、命令和参数不变
4. **格式统一**：保持技术文档的格式结构
5. **用户友好**：使用易于理解的中文技术表达

请直接输出翻译结果：

{source_text}`,

      // 新闻资讯翻译prompt
      news: `你是一个专业的新闻翻译专家，请将以下新闻内容翻译成中文。翻译要求：

1. **客观准确**：保持新闻的客观性和事实准确性
2. **时效性强**：使用符合中文新闻习惯的表达方式
3. **简洁明了**：使用简洁明了的语言，便于快速阅读
4. **标题突出**：如有标题，确保标题的吸引力和准确性
5. **背景保持**：保持新闻背景信息的完整性

请直接输出翻译结果：

{source_text}`,

      // 上下文增强翻译prompt
      contextual: `你是一个专业的翻译专家。我将提供一段文本及其上下文，请进行准确翻译。

**上下文信息**：{context}
**当前段落**：{current_text}

翻译要求：
1. 结合上下文理解当前段落的含义
2. 保持术语和概念的一致性
3. 确保翻译的连贯性和逻辑性
4. 使用自然流畅的中文表达

请直接输出翻译结果：`,

      // 商务文档翻译prompt
      business: `你是一个专业的商务翻译专家，请将以下商务文档翻译成中文。翻译要求：

1. **商务规范**：使用规范的商务中文表达
2. **专业术语**：准确翻译商务和法律术语
3. **正式语调**：保持正式的商务语调
4. **数据准确**：确保数字、日期、金额等信息准确
5. **格式完整**：保持商务文档的格式结构

请直接输出翻译结果：

{source_text}`,

      // 文学作品翻译prompt
      literary: `你是一个专业的文学翻译专家，请将以下文学文本翻译成中文。翻译要求：

1. **文学美感**：保持原文的文学美感和艺术性
2. **情感传达**：准确传达原文的情感色彩
3. **风格一致**：保持作者的写作风格
4. **文化适应**：适当进行文化背景的本土化处理
5. **韵律感**：如有诗歌，尽量保持韵律感

请直接输出翻译结果：

{source_text}`,

      // 日常对话翻译prompt
      casual: `你是一个专业的翻译专家，请将以下日常对话翻译成中文。翻译要求：

1. **自然流畅**：使用自然的中文口语表达
2. **语气保持**：保持原文的语气和情感
3. **文化适应**：适应中文的表达习惯
4. **简洁明了**：保持对话的简洁性
5. **语境理解**：理解对话的语境和背景

请直接输出翻译结果：

{source_text}`
    };

    // 文本类型检测关键词
    this.detectionKeywords = {
      academic: [
        'research', 'study', 'analysis', 'methodology', 'hypothesis',
        'experiment', 'data', 'results', 'conclusion', 'abstract',
        'introduction', 'literature review', 'discussion', 'references',
        'journal', 'publication', 'peer review', 'citation', 'theory',
        'model', 'framework', 'empirical', 'statistical', 'significant'
      ],
      technical: [
        'API', 'function', 'configure', 'install', 'documentation',
        'code', 'programming', 'software', 'system', 'database',
        'server', 'client', 'protocol', 'algorithm', 'framework',
        'library', 'module', 'class', 'method', 'variable',
        'parameter', 'return', 'exception', 'debug', 'compile'
      ],
      news: [
        'reported', 'according to', 'breaking', 'announced', 'statement',
        'press release', 'spokesperson', 'official', 'government',
        'president', 'minister', 'parliament', 'congress', 'election',
        'policy', 'economy', 'market', 'stock', 'crisis',
        'incident', 'event', 'yesterday', 'today', 'latest'
      ],
      business: [
        'contract', 'agreement', 'terms', 'conditions', 'clause',
        'revenue', 'profit', 'loss', 'investment', 'shareholder',
        'board', 'director', 'CEO', 'CFO', 'company', 'corporation',
        'business', 'market', 'sales', 'customer', 'client',
        'proposal', 'budget', 'financial', 'quarterly', 'annual'
      ],
      literary: [
        'character', 'plot', 'story', 'novel', 'poem', 'poetry',
        'metaphor', 'symbolism', 'theme', 'narrative', 'dialogue',
        'protagonist', 'antagonist', 'chapter', 'verse', 'stanza',
        'author', 'writer', 'literature', 'fiction', 'non-fiction',
        'drama', 'comedy', 'tragedy', 'romance', 'fantasy'
      ],
      casual: [
        'hey', 'hi', 'hello', 'thanks', 'thank you', 'please',
        'sorry', 'excuse me', 'how are you', 'what\'s up',
        'see you', 'bye', 'goodbye', 'yeah', 'ok', 'okay',
        'sure', 'maybe', 'probably', 'definitely', 'awesome',
        'cool', 'great', 'nice', 'wonderful', 'amazing'
      ]
    };
  }

  /**
   * 获取指定类型的prompt模板
   * @param {string} type - prompt类型
   * @param {object} variables - 模板变量
   * @returns {string} 填充后的prompt
   */
  getPrompt(type = 'general', variables = {}) {
    const template = this.templates[type] || this.templates.general;
    return this.interpolate(template, variables);
  }

  /**
   * 模板变量插值
   * @param {string} template - 模板字符串
   * @param {object} variables - 变量对象
   * @returns {string} 插值后的字符串
   */
  interpolate(template, variables) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * 智能检测文本类型（优化版本，减少检测时间）
   * @param {string} text - 待检测的文本
   * @param {string} _context - 上下文信息（未使用）
   * @returns {string} 检测到的文本类型
   */
  detectPromptType(text, _context = '') {
    if (!text || typeof text !== 'string') {
      return 'general';
    }

    // 优化：直接使用general类型，避免复杂检测导致翻译时间过长
    // 如果需要特定类型检测，可以通过options参数直接指定
    return 'general';

    // 注释掉复杂的检测逻辑以提高性能
    /*
    const lowerText = (text + ' ' + context).toLowerCase();
    const scores = {};

    // 计算每种类型的匹配分数
    for (const [type, keywords] of Object.entries(this.detectionKeywords)) {
      scores[type] = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) {
          scores[type] += matches.length;
        }
      }

      // 根据文本长度调整权重
      scores[type] = scores[type] / Math.max(1, Math.log(text.length / 100));
    }

    // 特殊规则检测
    if (this.isAcademicText(text)) {
      scores.academic += 2;
    }

    if (this.isTechnicalText(text)) {
      scores.technical += 2;
    }

    if (this.isNewsText(text)) {
      scores.news += 2;
    }

    // 找到得分最高的类型
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return context ? 'contextual' : 'general';
    }

    const detectedType = Object.keys(scores).find(type => scores[type] === maxScore);
    return detectedType || (context ? 'contextual' : 'general');
    */
  }

  /**
   * 检测是否为学术文本
   * @param {string} text - 文本内容
   * @returns {boolean}
   */
  isAcademicText(text) {
    const academicPatterns = [
      /\b(abstract|introduction|methodology|results|discussion|conclusion)\b/i,
      /\b(figure|table|equation)\s+\d+/i,
      /\b(et al\.|ibid\.|op\. cit\.)\b/i,
      /\([12]\d{3}\)/,  // 年份引用
      /\b(p\.|pp\.)\s*\d+/i  // 页码引用
    ];

    return academicPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 检测是否为技术文本
   * @param {string} text - 文本内容
   * @returns {boolean}
   */
  isTechnicalText(text) {
    const technicalPatterns = [
      /```[\s\S]*?```/,  // 代码块
      /`[^`]+`/,  // 行内代码
      /\b(function|class|method|variable)\s+\w+/i,
      /\b(GET|POST|PUT|DELETE)\b/,  // HTTP方法
      /\b\w+\.(js|py|java|cpp|html|css)\b/i,  // 文件扩展名
      /\b(npm|pip|git|docker)\s+\w+/i  // 命令行工具
    ];

    return technicalPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 检测是否为新闻文本
   * @param {string} text - 文本内容
   * @returns {boolean}
   */
  isNewsText(text) {
    const newsPatterns = [
      /\b(BREAKING|UPDATE|URGENT)\b/i,
      /\b(Reuters|AP|CNN|BBC|Associated Press)\b/i,
      /\b(said|told|announced|reported|stated)\s+(that|to)/i,
      /\b(yesterday|today|this morning|this afternoon|tonight)\b/i,
      /\b(according to|sources say|officials said)\b/i
    ];

    return newsPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 获取所有可用的prompt类型
   * @returns {Array} prompt类型列表
   */
  getAvailableTypes() {
    return Object.keys(this.templates);
  }

  /**
   * 添加自定义prompt模板
   * @param {string} type - 类型名称
   * @param {string} template - 模板内容
   * @param {Array} keywords - 检测关键词
   */
  addCustomTemplate(type, template, keywords = []) {
    this.templates[type] = template;
    if (keywords.length > 0) {
      this.detectionKeywords[type] = keywords;
    }
  }

  /**
   * 移除自定义prompt模板
   * @param {string} type - 类型名称
   */
  removeCustomTemplate(type) {
    if (type !== 'general') {  // 保护默认模板
      delete this.templates[type];
      delete this.detectionKeywords[type];
    }
  }
}

// 导出PromptManager类
export default PromptManager;
