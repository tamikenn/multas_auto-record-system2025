import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGIN_HISTORY_FILE = path.join(DATA_DIR, 'login-history.json');

function loadLoginHistory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOGIN_HISTORY_FILE)) {
      const data = fs.readFileSync(LOGIN_HISTORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading login history:', error);
  }
  return [];
}

function saveLoginHistory(history) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOGIN_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving login history:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, action } = req.body;

    if (!userName || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const history = loadLoginHistory();
    
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const entry = {
      timestamp,
      userName,
      action,
      userAgent: req.headers['user-agent'] || '',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    };
    
    history.push(entry);
    
    // 最新1000件のみ保持
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    saveLoginHistory(history);

    res.status(200).json({ 
      success: true,
      message: `${action} tracked successfully`
    });

  } catch (error) {
    console.error('Error tracking login:', error);
    // エラーが発生してもログイン処理自体は妨げない
    res.status(200).json({ 
      success: true,
      message: 'Login tracking skipped due to error'
    });
  }
}
