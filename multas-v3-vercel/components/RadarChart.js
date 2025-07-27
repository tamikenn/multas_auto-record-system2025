import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { categoryNames } from '../lib/categories';

// Chart.jsの設定
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function RadarChart({ posts }) {
  // カテゴリ別にカウント
  const categoryCounts = new Array(12).fill(0);
  posts.forEach(post => {
    if (post.category >= 1 && post.category <= 12) {
      categoryCounts[post.category - 1]++;
    }
  });
  
  // 最小値として0.5を設定し、実際のカウントに加算して表示をより見やすくする
  const displayCounts = categoryCounts.map(count => count + 0.5);

  // 12時計のラベル（元の順序のまま、表示位置は調整）
  const labels = [
    categoryNames[1],  // 1時: 医療倫理
    categoryNames[2],  // 2時: 地域医療
    categoryNames[3],  // 3時: 医学的知識
    categoryNames[4],  // 4時: 診察・手技
    categoryNames[5],  // 5時: 患者との関わり
    categoryNames[6],  // 6時: 統合的臨床能力
    categoryNames[7],  // 7時: 多職種連携
    categoryNames[8],  // 8時: コミュニケーション
    categoryNames[9],  // 9時: 一般教養
    categoryNames[10], // 10時: 保健・福祉
    categoryNames[11], // 11時: 行政
    categoryNames[12]  // 12時: 社会医学
  ];

  const data = {
    labels,
    datasets: [{
      label: '記録数',
      data: displayCounts,
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: 'rgba(33, 150, 243, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(33, 150, 243, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(33, 150, 243, 1)'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const actualCount = context.raw - 0.5;
            return `${context.label}: ${actualCount}件`;
          }
        }
      }
    },
    scales: {
      r: {
        startAngle: 30, // 150度時計回りに回転（-120 + 150 = 30）
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        min: 0,
        suggestedMax: Math.max(...displayCounts) > 0 ? Math.max(...displayCounts) + 2 : 5,
        ticks: {
          stepSize: 1,
          display: false,
          beginAtZero: true
        },
        pointLabels: {
          font: {
            size: 11
          },
          callback: function(label) {
            // ラベルが長い場合は改行
            if (label.length > 10) {
              const colonIndex = label.indexOf(':');
              if (colonIndex > 0) {
                return [label.substring(0, colonIndex + 1), label.substring(colonIndex + 1).trim()];
              }
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div style={{ 
      height: '400px', 
      backgroundColor: 'white', 
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>12時計分類レーダーチャート</h3>
      <Radar data={data} options={options} />
    </div>
  );
}