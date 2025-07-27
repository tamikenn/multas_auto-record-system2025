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

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

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

    const report = response.choices[0].message.content;

    res.status(200).json({ report });

  } catch (error) {
    console.error('レポート生成エラー:', error);
    res.status(500).json({ 
      error: 'レポート生成に失敗しました' 
    });
  }
}

// getCategoryNameはライブラリからインポートしたものを使用