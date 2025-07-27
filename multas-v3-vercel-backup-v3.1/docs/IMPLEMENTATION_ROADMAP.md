# Step 6-12 実装ロードマップ

## 🎯 実装方針
- 既存の`mobile-input.js`を拡張
- タブ切り替えで3画面（LOG/LIST/REPORT）
- モジュール化で保守性確保

## 📋 実装順序

### Step 6: タブ切り替え機構
```javascript
// タブコンポーネント追加
const tabs = ['LOG', 'LIST', 'REPORT'];
const [activeTab, setActiveTab] = useState('LOG');
```

### Step 7-9: AI機能統合
- 既に実装済み（classify.js）
- 追加: 長文の要素分解

### Step 10: AI高度化
```javascript
// 長文を複数要素に分解
const analyzeMultipleElements = async (text) => {
  if (text.length > 200) {
    // 文章を分割して個別に分類
  }
};
```

### Step 11: レーダーチャート
```javascript
// Chart.js追加
import { Radar } from 'react-chartjs-2';

const radarData = {
  labels: [
    '医療倫理', '地域医療', '医学知識',
    '診察・手技', '問題解決', '統合的臨床',
    '多職種連携', 'コミュニケーション', '安全管理',
    '職業観', '教養・人間性', '探究心'
  ],
  datasets: [{
    data: categoryCounts,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: 'rgba(33, 150, 243, 1)'
  }]
};
```

### Step 12: レポート生成
```javascript
// 10投稿以上で利用可能
const generateReport = async () => {
  if (posts.length >= 10) {
    const response = await fetch('/api/generate-report', {
      method: 'POST',
      body: JSON.stringify({ posts })
    });
  }
};
```

## 🔧 必要な追加
1. Chart.js インストール
2. react-chartjs-2 インストール
3. API エンドポイント追加

## ⏱ 予想時間
- 全体で2-3時間で実装可能
- 既存コードを活かして効率的に開発