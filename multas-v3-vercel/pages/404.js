import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ fontSize: '120px', margin: '0', color: '#2196F3' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
        ページが見つかりません
      </h2>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/mobile-input-tabs" style={{
          padding: '12px 24px',
          backgroundColor: '#2196F3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          MULTAsアプリへ
        </Link>
        <Link href="/teacher-dashboard" style={{
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          教員ダッシュボード
        </Link>
      </div>
    </div>
  );
}