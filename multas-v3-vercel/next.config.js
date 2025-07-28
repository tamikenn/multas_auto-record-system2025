/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的HTMLエクスポートを有効化
  output: 'export',
  
  // 画像最適化を無効化（静的エクスポート時は必須）
  images: {
    unoptimized: true
  },
  
  // トレイリングスラッシュを追加
  trailingSlash: true,
  
  // 基本パスの設定（必要に応じて）
  // basePath: '',
}

module.exports = nextConfig