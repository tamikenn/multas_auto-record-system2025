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
    console.log('OpenAI API 呼び出し開始:', text);
    
    const prompt = `以下の医学部実習での体験を、12時計分類のいずれかに分類してください。

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

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは医学教育の専門家です。体験内容を12時計分類で分類し、該当する数字（1-12）のみを回答してください。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const content = response.choices[0].message.content.trim();
    console.log('OpenAI API レスポンス:', content);
    
    // 数字を抽出
    const categoryMatch = content.match(/(\d+)/);
    const category = categoryMatch ? parseInt(categoryMatch[1]) : 8; // デフォルトはコミュニケーション
    
    // カテゴリが範囲外の場合は8（コミュニケーション）にする
    const finalCategory = (category >= 1 && category <= 12) ? category : 8;
    
    console.log('分類結果:', finalCategory);

    res.status(200).json({
      success: true,
      category: finalCategory,
      reason: `AI分類: カテゴリ${finalCategory}`
    });

  } catch (error) {
    console.error('OpenAI API エラー詳細:', error);
    console.error('エラーメッセージ:', error.message);
    console.error('エラーコード:', error.code);
    
    res.status(500).json({ 
      success: false,
      error: 'AI分類に失敗しました',
      category: 8, // フォールバック: コミュニケーション
      reason: `エラー: ${error.message}`,
      debug: {
        errorType: error.constructor.name,
        errorCode: error.code,
        hasApiKey: !!process.env.OPENAI_API_KEY
      }
    });
  }
}