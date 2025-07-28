import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, posts } = req.body;

  if (!category || !posts) {
    return res.status(400).json({ error: 'Category and posts are required' });
  }

  // APIキーが設定されていない場合はダミーサマリーを返す
  if (!process.env.OPENAI_API_KEY) {
    const firstPost = posts.split('\n')[0]?.replace('・', '').trim() || '実習体験';
    const dummySummary = `私は${category}に関する実習を通じて、${firstPost}という貴重な経験をしました。この体験から、医療現場における${category}の重要性を深く理解することができました。特に印象的だったのは、現場での実践を通じて学ぶことの大切さです。今後の医療実践において、この経験を活かしていきたいと思います。\n\n（テスト環境のため、AI要約は簡易版となっています）`;
    
    return res.status(200).json({ summary: dummySummary });
  }

  try {
    const prompt = `あなたは、文章のトレーニングを十分に経験し、医学的にも医師に近いレベルで語ることができる医学教育の専門家です。
以下は医学部生が「${category}」カテゴリで記録した実習体験です。

体験記録:
${posts}

上記の体験記録から、特に重要または興味深い1-2つの要素をピックアップし、それらを深く分析・考察してください。
全てを網羅する必要はありません。選んだ要素について、医学的な観点から掘り下げた文章を作成してください。

以下の形式で、300-400文字程度の洗練された文章を作成してください：
- 「私は」で始める一人称の文章
- 選んだ体験の具体的な描写
- その体験から得られた医学的洞察や学び
- 将来の医療実践への示唆や展望

高品質で読み応えのある文章:`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "あなたは医学教育と臨床経験に精通した専門家です。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 600
    });

    const summary = completion.choices[0].message.content.trim();

    res.status(200).json({ summary });

  } catch (error) {
    console.error('Summary generation error:', error);
    // フォールバック
    const fallbackSummary = `私は${category}に関する実習を通じて、${posts.split('\n')[0]}という貴重な経験をしました。この体験は、医学生として成長する上で重要な学びとなりました。`;
    
    res.status(200).json({ 
      summary: fallbackSummary
    });
  }
}