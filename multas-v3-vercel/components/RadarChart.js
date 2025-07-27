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
  const categoryCounts = posts.reduce((counts, post) => {
    if (post.category >= 1 && post.category <= 12) {
      counts[post.category - 1]++;
    }
    return counts;
  }, new Array(12).fill(0));
  
  // 最小値として0.5を設定し、実際のカウントに加算して表示をより見やすくする
  const displayCounts = categoryCounts.map(count => count + 0.5);

  // 12時計のラベル
  const labels = Array.from({ length: 12 }, (_, i) => categoryNames[i + 1]);

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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw - 0.5}件`
        }
      }
    },
    scales: {
      r: {
        startAngle: 30,
        angleLines: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
        min: 0,
        suggestedMax: Math.max(...displayCounts, 3) + 2,
        ticks: { stepSize: 1, display: false },
        pointLabels: {
          font: { size: 11 },
          callback: (label) => {
            if (label.length > 10 && label.includes(':')) {
              const [category, desc] = label.split(':');
              return [category + ':', desc.trim()];
            }
            return label;
          }
        }
      }
    }
  };

  const containerStyle = {
    height: '400px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>12時計分類レーダーチャート</h3>
      <Radar data={data} options={options} />
    </div>
  );
}