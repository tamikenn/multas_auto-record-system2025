export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 実際の実装では、Google Sheetsやデータベースでいいね数を管理
    // ここではシンプルに成功レスポンスを返す
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}