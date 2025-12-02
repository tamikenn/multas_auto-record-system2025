import OpenAI from 'openai';
import { getCategoryName } from '../../lib/categories';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { posts } = req.body;

  if (!posts || posts.length < 10) {
    return res.status(400).json({ error: '10件以上の投稿が必要です' });
  }

  // APIキーが設定されていない場合はダミーレポートを生成
  if (!process.env.OPENAI_API_KEY) {
    // カテゴリ別集計
    const categoryCounts = {};
    posts.forEach(post => {
      const category = post.category;
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });

    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const dummyReport = `実習期間中に${posts.length}件の記録を残し、特に${getCategoryName(parseInt(topCategory[0]))}に関する体験が${topCategory[1]}件と最も多くなりました。これは地域医療の現場でこの分野の重要性を実感したことを示しています。今後は、よりバランスよく各カテゴリを意識して学習を進めることが大切です。\n\n（テスト環境のため、AIレポートは簡易版となっています）`;
    
    return res.status(200).json({ report: dummyReport });
  }

  const aiProvider = process.env.AI_PROVIDER || 'openai';
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  try {
    // カテゴリ別集計
    const categoryCounts = {};
    posts.forEach(post => {
      const category = post.category;
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });

    // 投稿内容を要約用に整形
    const summaryData = posts.slice(0, 20).map(post => 
      `- ${post.text} (${getCategoryName(post.category)})`
    ).join('\n');

    const prompt = `
医学部実習の振り返りレポートを作成してください。

【投稿数】${posts.length}件

【カテゴリ別集計】
${Object.entries(categoryCounts).map(([cat, count]) => 
  `${getCategoryName(parseInt(cat))}: ${count}件`
).join('\n')}

【最近の投稿内容（抜粋）】
${summaryData}

以下の観点でレポートを作成してください：
1. 実習での学びの傾向分析
2. 特に多く経験したカテゴリとその意義
3. 今後伸ばすべき領域
4. 総合的な成長の評価

300-400文字程度でまとめてください。
`;

    let report;

    if (aiProvider === 'local' || !hasOpenAIKey) {
      // LocalLLMを使用
      const ollamaUrl = process.env.LOCAL_LLM_API_URL || 'http://localhost:11434/api/generate';
      const model = process.env.LOCAL_LLM_MODEL_REPORT || 'qwen2.5:14b';
      
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 800,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      report = data.response ? data.response.trim() : '';
    } else {
      // OpenAIを使用
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "あなたは医学教育の専門家です。学生の成長を支援する建設的なフィードバックを提供してください。" 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      report = response.choices[0].message.content;
    }

    res.status(200).json({ report });

  } catch (error) {
    console.error('レポート生成エラー:', error);
    res.status(500).json({ 
      error: 'レポート生成に失敗しました' 
    });
  }
}

// getCategoryNameはライブラリからインポートしたものを使用