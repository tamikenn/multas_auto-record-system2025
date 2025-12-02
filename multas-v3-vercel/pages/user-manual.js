import React from 'react';
import Head from 'next/head';

export default function UserManual() {
  return (
    <>
      <Head>
        <title>MULTAs v3.4 使い方ガイド</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className="manual-container">
        <header className="manual-header">
          <h1>MULTAs v3.4 使い方ガイド</h1>
          <p className="subtitle">医学部実習記録システム</p>
        </header>

        <main className="manual-content">
          <section className="section">
            <h2>🚀 はじめに</h2>
            <p>
              MULTAsは、医学部実習での体験を簡単に記録・分類できるシステムです。
              AIが自動で12のカテゴリーに分類し、学習の振り返りをサポートします。
            </p>
          </section>

          <section className="section">
            <h2>📱 アクセス方法</h2>
            <div className="step-box">
              <p>1. スマートフォンまたはPCで以下のURLにアクセス</p>
              <div className="url-box">
                <a href="https://multas-v3.vercel.app" target="_blank" rel="noopener noreferrer">
                  https://multas-v3.vercel.app
                </a>
              </div>
              <p>2. ブックマークに追加しておくと便利です</p>
            </div>
          </section>

          <section className="section">
            <h2>🔑 ログイン</h2>
            <div className="step-box">
              <p><strong>初回ログイン：</strong></p>
              <ol>
                <li>学籍番号を入力（例：2024001）</li>
                <li>「ログイン」ボタンをタップ</li>
                <li>ログイン情報は自動的に保存されます</li>
              </ol>
              <p className="tip">💡 次回以降は自動的にログインされます</p>
            </div>
          </section>

          <section className="section">
            <h2>✍️ 実習記録の投稿</h2>
            <div className="step-box">
              <ol>
                <li>「LOG」タブが選択されていることを確認</li>
                <li>テキストエリアに実習での体験を入力
                  <div className="example-box">
                    <p><strong>記入例：</strong></p>
                    <ul>
                      <li>「心エコーの基本的な見方を学んだ」</li>
                      <li>「患者さんへの病状説明に同席し、伝え方の重要性を実感した」</li>
                      <li>「採血手技を初めて実施し、緊張したが成功した」</li>
                    </ul>
                  </div>
                </li>
                <li>「送信」ボタンをタップ</li>
                <li>AIが自動的にカテゴリー分類を行います</li>
              </ol>
            </div>
          </section>

          <section className="section">
            <h2>🏷️ 12のカテゴリー</h2>
            <div className="categories-grid">
              <div className="category-card" style={{backgroundColor: '#FF6B6B'}}>
                <span className="category-number">1</span>
                <span className="category-name">診察・診断</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#4ECDC4'}}>
                <span className="category-number">2</span>
                <span className="category-name">治療・手技</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#45B7D1'}}>
                <span className="category-number">3</span>
                <span className="category-name">検査・評価</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#96CEB4'}}>
                <span className="category-number">4</span>
                <span className="category-name">カルテ・書類</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#FECA57'}}>
                <span className="category-number">5</span>
                <span className="category-name">カンファ</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#48DBFB'}}>
                <span className="category-number">6</span>
                <span className="category-name">患者対応</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#FF9FF3'}}>
                <span className="category-number">7</span>
                <span className="category-name">他職種連携</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#54A0FF'}}>
                <span className="category-number">8</span>
                <span className="category-name">知識・学習</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#5F27CD'}}>
                <span className="category-number">9</span>
                <span className="category-name">症例・経験</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#00D2D3'}}>
                <span className="category-number">10</span>
                <span className="category-name">振り返り</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#EE5A24'}}>
                <span className="category-number">11</span>
                <span className="category-name">感情・成長</span>
              </div>
              <div className="category-card" style={{backgroundColor: '#A29BFE'}}>
                <span className="category-number">12</span>
                <span className="category-name">その他</span>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>📊 記録の確認</h2>
            <div className="tabs-explanation">
              <div className="tab-item">
                <h3>📝 LOGタブ</h3>
                <p>実習記録を投稿する画面です。日々の体験をここから記録します。</p>
              </div>
              <div className="tab-item">
                <h3>📋 LISTタブ</h3>
                <p>自分の過去の投稿一覧を確認できます。カテゴリー別に色分けされて表示されます。</p>
              </div>
              <div className="tab-item">
                <h3>📈 REPORTタブ</h3>
                <p>カテゴリー別の投稿数がグラフで表示されます。自分の学習傾向を把握できます。</p>
              </div>
              <div className="tab-item">
                <h3>🌐 みんなタブ</h3>
                <p>他の学生がシェアした投稿を見ることができます（開発中）。</p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>💡 効果的な使い方のコツ</h2>
            <div className="tips-list">
              <div className="tip-card">
                <h4>1. その日のうちに記録する</h4>
                <p>実習での体験は新鮮なうちに記録しましょう。詳細な記憶が残っているうちに記録することで、より有意義な振り返りができます。</p>
              </div>
              <div className="tip-card">
                <h4>2. 具体的に書く</h4>
                <p>「勉強になった」ではなく「心電図のST上昇を見て心筋梗塞を疑うことを学んだ」など、具体的に記載しましょう。</p>
              </div>
              <div className="tip-card">
                <h4>3. 感情も記録する</h4>
                <p>「緊張した」「嬉しかった」など、その時の感情も記録すると、成長の過程が見えやすくなります。</p>
              </div>
              <div className="tip-card">
                <h4>4. 定期的に振り返る</h4>
                <p>REPORTタブで自分の学習傾向を確認し、不足している分野を意識して実習に臨みましょう。</p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>❓ よくある質問</h2>
            <div className="faq-list">
              <div className="faq-item">
                <h4>Q: オフラインでも使えますか？</h4>
                <p>A: はい、投稿はローカルに保存されるため、オフラインでも記録できます。オンライン時に自動的に同期されます。</p>
              </div>
              <div className="faq-item">
                <h4>Q: 過去の投稿を編集できますか？</h4>
                <p>A: 現在のバージョンでは編集機能はありません。新しい気づきは追加投稿として記録してください。</p>
              </div>
              <div className="faq-item">
                <h4>Q: データは安全に保管されますか？</h4>
                <p>A: はい、データは暗号化された通信で送信され、安全に保管されます。</p>
              </div>
              <div className="faq-item">
                <h4>Q: スマホを変えてもデータは引き継げますか？</h4>
                <p>A: 同じ学籍番号でログインすれば、過去の投稿を確認できます。</p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>🆘 困ったときは</h2>
            <div className="support-box">
              <p>技術的な問題や使い方でわからないことがあれば、以下にお問い合わせください：</p>
              <ul>
                <li>担当教員に相談</li>
                <li>実習グループのリーダーに確認</li>
              </ul>
            </div>
          </section>

          <div className="back-button-container">
            <a href="/mobile-input-tabs" className="back-button">
              システムに戻る
            </a>
          </div>
        </main>
      </div>

      <style jsx>{`
        .manual-container {
          min-height: 100vh;
          background-color: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .manual-header {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }

        .manual-header h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
        }

        .subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }

        .manual-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section h2 {
          color: #333;
          font-size: 22px;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section h3 {
          color: #555;
          font-size: 18px;
          margin: 16px 0 8px 0;
        }

        .section h4 {
          color: #666;
          font-size: 16px;
          margin: 12px 0 8px 0;
        }

        .section p {
          line-height: 1.8;
          color: #555;
          margin: 8px 0;
        }

        .step-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }

        .step-box ol {
          margin: 12px 0;
          padding-left: 24px;
        }

        .step-box li {
          margin: 8px 0;
          line-height: 1.8;
        }

        .url-box {
          background: #e3f2fd;
          border: 1px solid #2196F3;
          border-radius: 8px;
          padding: 12px;
          margin: 12px 0;
          text-align: center;
        }

        .url-box a {
          color: #2196F3;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
        }

        .tip {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 12px 0;
          border-radius: 4px;
        }

        .example-box {
          background: #e8f5e9;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }

        .example-box ul {
          margin: 8px 0;
          padding-left: 24px;
        }

        .example-box li {
          margin: 6px 0;
          color: #2e7d32;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .category-card {
          color: white;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .category-number {
          font-weight: bold;
          opacity: 0.8;
        }

        .tabs-explanation {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-item {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #2196F3;
        }

        .tab-item h3 {
          margin: 0 0 8px 0;
          color: #2196F3;
        }

        .tab-item p {
          margin: 0;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tip-card {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
        }

        .tip-card h4 {
          margin: 0 0 8px 0;
          color: #4CAF50;
        }

        .tip-card p {
          margin: 0;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
        }

        .faq-item h4 {
          margin: 0 0 8px 0;
          color: #1976D2;
        }

        .faq-item p {
          margin: 0;
        }

        .support-box {
          background: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 8px;
          padding: 16px;
        }

        .support-box ul {
          margin: 8px 0 0 0;
          padding-left: 24px;
        }

        .back-button-container {
          text-align: center;
          margin: 40px 0;
        }

        .back-button {
          display: inline-block;
          background: #2196F3;
          color: white;
          padding: 12px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.3s;
        }

        .back-button:hover {
          background: #1976D2;
        }

        @media (max-width: 768px) {
          .manual-header h1 {
            font-size: 24px;
          }
          
          .manual-content {
            padding: 16px;
          }
          
          .section {
            padding: 20px;
          }
          
          .categories-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .category-card {
            font-size: 12px;
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}