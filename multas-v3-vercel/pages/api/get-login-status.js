import fs from 'fs';
import path from 'path';

const LOGIN_HISTORY_FILE = path.join(process.cwd(), 'data', 'login-history.json');

function loadLoginHistory() {
  try {
    if (!fs.existsSync(LOGIN_HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOGIN_HISTORY_FILE, 'utf-8'));
  } catch (error) {
    console.error('Error loading login history:', error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const history = loadLoginHistory();

    const lastLoginByUser = {};
    for (const entry of history) {
      const { userName, action, timestamp } = entry;
      if (!userName) continue;
      if (action === 'login') {
        if (!lastLoginByUser[userName] || new Date(timestamp) > new Date(lastLoginByUser[userName])) {
          lastLoginByUser[userName] = timestamp;
        }
      }
    }

    res.status(200).json({
      success: true,
      lastLoginByUser,
    });
  } catch (error) {
    console.error('Error fetching login status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch login status',
    });
  }
}
