/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化設定
  images: {
    unoptimized: true
  },
  
  // トレイリングスラッシュを削除（問題の原因の可能性）
  trailingSlash: false,
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://multas-v3-vercel.vercel.app'
  }
}

module.exports = nextConfig