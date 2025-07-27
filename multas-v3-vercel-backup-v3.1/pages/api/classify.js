import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'テキストが必要です' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const prompt = `
以下の医学部実習での体験を、12時計分類のいずれかに分類してください。

12時計分類:
0: 分類不能（医学実習と関連が不明）
1: 医療倫理（インフォームドコンセント、患者の権利、守秘義務）
2: 地域医療（地域包括ケア、在宅医療、地域連携）
3: 医学知識（病態生理、薬理、診断基準）
4: 診察・手技（身体診察、医療手技、検査手法）
5: 患者に対する問題解決能力（臨床推論、診断、治療計画）
6: 統合的臨床（複数要素を含む臨床対応）
7: 多職種連携（チーム医療、院内連携）
8: コミュニケーション（傾聴、共感、説明、信頼関係）
9: 一般教養（医学以外の知識）
10: 保健・福祉（社会的サポート、福祉制度、介護）
11: 行政（病院間連携、紹介）
12: 社会医学/公衆衛生（地域保健、予防医学）

体験内容: ${text}

回答は以下の形式でお願いします:
カテゴリ番号: [1-12の数字]
理由: [簡潔な分類理由]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "あなたは医学教育の専門家です。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0].message.content;
    
    // 回答をパース
    const categoryMatch = content.match(/カテゴリ番号[：:]\s*(\d+)/);
    const reasonMatch = content.match(/理由[：:]\s*(.+)/);
    
    const category = categoryMatch ? parseInt(categoryMatch[1]) : 0;
    const reason = reasonMatch ? reasonMatch[1].trim() : content;

    res.status(200).json({
      category: category,
      reason: reason
    });

  } catch (error) {
    console.error('OpenAI API エラー:', error);
    res.status(500).json({ 
      error: 'AI分類に失敗しました',
      // フォールバック: エラー時はカテゴリ0を返す
      category: 0,
      reason: 'エラーが発生しました'
    });
  }
}