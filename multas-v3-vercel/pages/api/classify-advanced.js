import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // 長文判定（200文字以上）
    const isLongText = text.length > 200;
    
    if (isLongText) {
      // 長文の場合は要素分解
      const elements = await analyzeMultipleElements(text);
      return res.status(200).json({
        isMultiple: true,
        elements,
        originalText: text
      });
    } else {
      // 通常の分類
      const result = await classifySingleElement(text);
      return res.status(200).json({
        isMultiple: false,
        ...result
      });
    }
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ error: 'Classification failed' });
  }
}

// 単一要素の分類（既存の処理）
async function classifySingleElement(text) {
  const prompt = `あなたは地域医療実習の体験を分類する専門家です。
以下の学生の体験を、12時計のカテゴリのいずれかに分類してください。

カテゴリ:
1時: 医療倫理
2時: 地域医療
3時: 医学的知識
4時: 診察・手技
5時: 問題解決能力
6時: 統合的な臨床能力
7時: 多職種連携
8時: コミュニケーションスキル
9時: 社会常識・一般教養
10時: 保健・福祉
11時: 行政
12時: 社会医学/公衆衛生

体験内容:
${text}

以下の形式で回答してください:
カテゴリ: [1-12の数字]
理由: [分類の理由を簡潔に]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const response = completion.choices[0].message.content;
  const categoryMatch = response.match(/カテゴリ[：:]?\s*(\d+)/);
  const reasonMatch = response.match(/理由[：:]?\s*(.+)/);

  return {
    category: categoryMatch ? parseInt(categoryMatch[1]) : 0,
    reason: reasonMatch ? reasonMatch[1].trim() : "分類理由不明",
    confidence: 0.8
  };
}

// 複数要素の分析
async function analyzeMultipleElements(text) {
  const prompt = `あなたは地域医療実習の体験を分析する専門家です。
以下の長文の体験記録を読み、含まれている複数の学習要素を抽出してください。
それぞれの要素について、独立した学習項目として分類可能な単位で分割してください。

重要な指示:
- 各要素は自然な日本語で簡潔にまとめてください
- 「〜体験」「〜経験」という語尾を避け、多様な表現を使ってください
- 動詞の終止形（〜した、〜学んだ、〜気づいた等）や体言止めを活用してください
- 元の文章の重要なポイントを保持しつつ、読みやすく整理してください

体験内容:
${text}

以下の形式で、含まれている要素を列挙してください（最大5つまで）:
要素1: [抽出した内容を自然な日本語で]
要素2: [抽出した内容を自然な日本語で]
...`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const response = completion.choices[0].message.content;
  const elements = [];
  
  // 要素を抽出
  const elementMatches = response.matchAll(/要素\d+[：:]?\s*(.+)/g);
  for (const match of elementMatches) {
    const elementText = match[1].trim();
    if (elementText && elementText.length > 10) {
      // 各要素を個別に分類
      const classification = await classifySingleElement(elementText);
      elements.push({
        text: elementText,
        ...classification
      });
    }
  }

  // 要素が見つからない場合は全体を1つの要素として扱う
  if (elements.length === 0) {
    const classification = await classifySingleElement(text);
    elements.push({
      text: text.substring(0, 100) + '...',
      ...classification
    });
  }

  return elements;
}