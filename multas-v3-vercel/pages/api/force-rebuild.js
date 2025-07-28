// このファイルはVercelに変更を検知させるためのダミーファイルです
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Force rebuild trigger',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
}