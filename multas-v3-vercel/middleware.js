import { NextResponse } from 'next/server';

export function middleware(request) {
  // multas-v3.vercel.appドメインへのリクエストを処理
  const url = request.nextUrl.clone();
  
  // 認証が必要なドメインの場合、適切なドメインにリダイレクト
  if (url.hostname === 'multas-v3.vercel.app') {
    // APIリクエストは許可
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // それ以外は multas-v3-vercel.vercel.app にリダイレクト
    url.hostname = 'multas-v3-vercel.vercel.app';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*'
};