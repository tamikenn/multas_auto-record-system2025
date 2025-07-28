export default function Home() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>MULTAs v3</h1>
      
      <div style={{ 
        marginBottom: '40px', 
        padding: '30px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>🎉 MULTAs v3</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          実習での体験を記録し、AIが12時計分類で整理します
        </p>
        <a 
          href="/mobile-input-tabs" 
          style={{ 
            display: 'inline-block',
            padding: '16px 32px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
        >
          アプリケーションを開始 →
        </a>
        
        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>※Google ChromeまたはSafariでの利用を推奨します</p>
          <p>スマートフォンの場合は「ホーム画面に追加」をおすすめ</p>
        </div>
      </div>
      
      <div style={{ 
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3>主な機能</h3>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📝 実習記録の入力
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            🤖 AI自動分類
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📊 レーダーチャート
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📄 レポート生成
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            ✏️ 編集・削除機能
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📱 モバイル最適化
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            🎮 レベル・経験値システム
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📅 日付管理機能
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            👥 みんなの学び
          </li>
          <li style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            📥 PDF出力機能
          </li>
        </ul>
      </div>
    </div>
  );
}