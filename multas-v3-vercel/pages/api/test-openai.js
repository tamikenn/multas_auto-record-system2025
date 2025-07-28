export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OPENAI_API_KEY is not set',
        hasKey: false 
      });
    }
    
    // APIキーの最初と最後の文字を表示（セキュリティのため一部のみ）
    const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    
    // OpenAI APIの簡単なテスト
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      return res.status(200).json({ 
        success: true,
        hasKey: true,
        maskedKey: maskedKey,
        apiStatus: 'Valid API Key'
      });
    } else {
      const errorData = await response.json();
      return res.status(200).json({ 
        success: false,
        hasKey: true,
        maskedKey: maskedKey,
        apiStatus: 'Invalid API Key',
        error: errorData.error?.message || 'Unknown error'
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message
    });
  }
}