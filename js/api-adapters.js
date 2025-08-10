/**
 * 语影翻译插件 - API适配器系统
 * 支持多种大模型API的统一接口
 */

// API适配器基类
class TranslationAPIAdapter {
  constructor(apiKey, _config = {}) {
    this.apiKey = apiKey;
    this.config = _config;
    this.rateLimitDelay = 1000; // 默认1秒延迟
    this.lastRequestTime = 0;
  }

  async translate(text, _options = {}) {
    throw new Error('translate method must be implemented');
  }

  validateConfig() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API密钥不能为空');
    }
  }

  // 构建翻译prompt
  buildPrompt(text, _options = {}) {
    const { promptType = 'general', promptVariables = {} } = _options;
    // PromptManager will be available globally after initialization
    const promptManager = new globalThis.PromptManager();

    const variables = {
      source_text: text,
      current_text: text,
      ...promptVariables
    };

    return promptManager.getPrompt(promptType, variables);
  }

  // 速率限制控制
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  // 解析响应的通用方法
  parseResponse(response, text) {
    return {
      translatedText: response,
      originalText: text,
      detectedLang: 'auto',
      confidence: 0.9,
      fromCache: false
    };
  }
}

// DeepSeek API适配器
class DeepSeekAdapter extends TranslationAPIAdapter {
  constructor(apiKey) {
    super(apiKey, {
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      maxTokens: 2000,
      temperature: 0.3
    });
    this.rateLimitDelay = 500; // DeepSeek较快
  }

  async translate(text, _options = {}) {
    this.validateConfig();
    await this.enforceRateLimit();

    const prompt = this.buildPrompt(text, _options);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('DeepSeek API返回空结果');
      }

      return this.parseResponse(translatedText, text);
    } catch (error) {
      console.error('DeepSeek翻译错误:', error);
      throw error;
    }
  }
}

// 通义千问API适配器
class TongyiAdapter extends TranslationAPIAdapter {
  constructor(apiKey) {
    super(apiKey, {
      baseURL: 'https://dashscope.aliyuncs.com/api/v1',
      model: 'qwen-turbo'
    });
    this.rateLimitDelay = 800;
  }

  async translate(text, _options = {}) {
    this.validateConfig();
    await this.enforceRateLimit();

    const prompt = this.buildPrompt(text, _options);

    try {
      const response = await fetch(`${this.config.baseURL}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          input: {
            prompt: prompt
          },
          parameters: {
            temperature: 0.3,
            max_tokens: 2000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`通义千问API错误: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.output?.text?.trim();

      if (!translatedText) {
        throw new Error('通义千问API返回空结果');
      }

      return this.parseResponse(translatedText, text);
    } catch (error) {
      console.error('通义千问翻译错误:', error);
      throw error;
    }
  }
}

// OpenAI API适配器
class OpenAIAdapter extends TranslationAPIAdapter {
  constructor(apiKey) {
    super(apiKey, {
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.3
    });
    this.rateLimitDelay = 1000;
  }

  async translate(text, _options = {}) {
    this.validateConfig();
    await this.enforceRateLimit();

    const prompt = this.buildPrompt(text, _options);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('OpenAI API返回空结果');
      }

      return this.parseResponse(translatedText, text);
    } catch (error) {
      console.error('OpenAI翻译错误:', error);
      throw error;
    }
  }
}

// Google Gemini API适配器
class GeminiAdapter extends TranslationAPIAdapter {
  constructor(apiKey) {
    super(apiKey, {
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      model: 'gemini-pro'
    });
    this.rateLimitDelay = 1200;
  }

  async translate(text, _options = {}) {
    this.validateConfig();
    await this.enforceRateLimit();

    const prompt = this.buildPrompt(text, _options);

    try {
      const response = await fetch(`${this.config.baseURL}/models/${this.config.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!translatedText) {
        throw new Error('Gemini API返回空结果');
      }

      return this.parseResponse(translatedText, text);
    } catch (error) {
      console.error('Gemini翻译错误:', error);
      throw error;
    }
  }
}

// 文心一言API适配器
class WenxinAdapter extends TranslationAPIAdapter {
  constructor(apiKey) {
    super(apiKey, {
      baseURL: 'https://aip.baidubce.com/rpc/2.0',
      model: 'ernie-bot-turbo'
    });
    this.rateLimitDelay = 1000;
  }

  async translate(text, _options = {}) {
    this.validateConfig();
    await this.enforceRateLimit();

    const prompt = this.buildPrompt(text, _options);

    try {
      const response = await fetch(`${this.config.baseURL}/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_output_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`文心一言API错误: ${response.status} - ${errorData.error_msg || response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.result?.trim();

      if (!translatedText) {
        throw new Error('文心一言API返回空结果');
      }

      return this.parseResponse(translatedText, text);
    } catch (error) {
      console.error('文心一言翻译错误:', error);
      throw error;
    }
  }
}

// 导出所有适配器
export {
  TranslationAPIAdapter,
  DeepSeekAdapter,
  TongyiAdapter,
  OpenAIAdapter,
  GeminiAdapter,
  WenxinAdapter
};
