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

  // 12時計のラベル（名称のみ）
  const labels = [
    categoryNames[1],
    categoryNames[2],
    categoryNames[3],
    categoryNames[4],
    categoryNames[5],
    categoryNames[6],
    categoryNames[7],
    categoryNames[8],
    categoryNames[9],
    categoryNames[10],
    categoryNames[11],
    categoryNames[12]
  ];

  const data = {
    labels,
    datasets: [{
      label: '記録数',
      data: categoryCounts,
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
            return `${context.label}: ${context.raw}件`;
          }
        }
      }
    },
    scales: {
      r: {
        startAngle: 30, // 30度時計回りに回転（1時が2時の位置に）
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...categoryCounts) + 2,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
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