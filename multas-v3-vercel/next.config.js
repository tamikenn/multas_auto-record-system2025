/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートを削除（APIルートを使用するため）
  // output: 'export',
  
  // 画像最適化設定
  images: {
    unoptimized: true
  },
  
  // トレイリングスラッシュを追加
  trailingSlash: true,
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://multas-v3-vercel.vercel.app'
  }
}

module.exports = nextConfig