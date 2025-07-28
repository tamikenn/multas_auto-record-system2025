function Error({ statusCode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        {statusCode || '404'}
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        {statusCode === 404
          ? 'ページが見つかりません'
          : statusCode
          ? `エラー ${statusCode} が発生しました`
          : 'エラーが発生しました'}
      </p>
      <a href="/" style={{ marginTop: '20px', color: '#2196F3', textDecoration: 'none' }}>
        ホームに戻る
      </a>
    </div>
  );
}

// Vercelデプロイ用に静的プロップスを使用
export async function getStaticProps() {
  return {
    props: {
      statusCode: 404
    }
  };
}

export default Error;