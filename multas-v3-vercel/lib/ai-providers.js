// AI Provider abstraction layer
// 複数のAI APIを統一インターフェースで管理

export class AIClassifier {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai'; // 'openai', 'claude', 'local'
  }

  async classify(text) {
    try {
      switch (this.provider) {
        case 'claude':
          return await this.classifyWithClaude(text);
        case 'local':
          return await this.classifyWithLocal(text);
        case 'openai':
        default:
          return await this.classifyWithOpenAI(text);
      }
    } catch (error) {
      console.error(`AI分類エラー (${this.provider}):`, error);
      return this.getFallbackClassification(text);
    }
  }

  async classifyWithOpenAI(text) {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは医学教育の専門家です。体験内容を12時計分類で分類し、該当する数字（1-12）のみを回答してください。" },
        { role: "user", content: this.getPrompt(text) }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const content = response.choices[0].message.content.trim();
    const categoryMatch = content.match(/(\d+)/);
    const category = categoryMatch ? parseInt(categoryMatch[1]) : 8;
    
    return {
      success: true,
      category: (category >= 1 && category <= 12) ? category : 8,
      reason: `OpenAI分類: カテゴリ${category}`,
      provider: 'openai'
    };
  }

  async classifyWithClaude(text) {
    // Claude API implementation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: this.getPrompt(text)
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text.trim();
    const categoryMatch = content.match(/(\d+)/);
    const category = categoryMatch ? parseInt(categoryMatch[1]) : 8;

    return {
      success: true,
      category: (category >= 1 && category <= 12) ? category : 8,
      reason: `Claude分類: カテゴリ${category}`,
      provider: 'claude'
    };
  }

  async classifyWithLocal(text) {
    // ローカルLLM implementation (将来的)
    // Ollama, LM Studio, または独自モデルとの連携
    
    // 現在は簡単なキーワードベース分類をフォールバック
    return this.getKeywordBasedClassification(text);
  }

  getKeywordBasedClassification(text) {
    const keywords = {
      1: ['倫理', 'インフォームドコンセント', '患者の権利', '守秘義務'],
      2: ['地域', '在宅', '地域包括', '地域連携'],
      3: ['病態', '薬理', '診断', '疾患', '症状'],
      4: ['診察', '手技', '検査', '聴診', '触診'],
      5: ['分析', '思考', '判断', '問題解決'],
      6: ['統合', '複合', '総合的'],
      7: ['チーム', '多職種', '連携', '協働'],
      8: ['コミュニケーション', '傾聴', '共感', '説明', '会話'],
      9: ['教養', '一般', '文化'],
      10: ['福祉', '介護', 'ソーシャル'],
      11: ['行政', '紹介', '病院間'],
      12: ['公衆衛生', '予防', '地域保健']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => text.includes(word))) {
        return {
          success: true,
          category: parseInt(category),
          reason: `キーワード分類: カテゴリ${category}`,
          provider: 'keyword'
        };
      }
    }

    return {
      success: true,
      category: 8, // デフォルト: コミュニケーション
      reason: 'デフォルト分類: コミュニケーション',
      provider: 'fallback'
    };
  }

  getFallbackClassification(text) {
    return this.getKeywordBasedClassification(text);
  }

  getPrompt(text) {
    return `以下の医学部実習での体験を、12時計分類のいずれかに分類してください。

12時計分類:
1: 医療倫理（インフォームドコンセント、患者の権利、守秘義務）
2: 地域医療（地域包括ケア、在宅医療、地域連携）
3: 医学知識（病態生理、薬理、診断基準）
4: 診察・手技（身体診察、医療手技、検査手法）
5: 問題解決能力（分析力、思考力、判断力）
6: 統合的臨床（複数要素を含む臨床対応）
7: 多職種連携（チーム医療、院内連携）
8: コミュニケーション（傾聴、共感、説明、信頼関係）
9: 一般教養（医学以外の知識）
10: 保健・福祉（社会的サポート、福祉制度、介護）
11: 行政（病院間連携、紹介）
12: 社会医学/公衆衛生（地域保健、予防医学）

体験内容: ${text}

数字のみで回答してください（1-12）:`;
  }
}