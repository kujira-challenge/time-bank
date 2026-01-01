import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // デバッグログ（一時的）
  console.log('[Auth Callback] Code received:', !!code);
  console.log('[Auth Callback] Next path:', next);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // デバッグログ（一時的）
    console.log('[Auth Callback] Exchange success:', !!data.session);
    console.log('[Auth Callback] Exchange error:', error?.message);

    if (!error && data.session) {
      // セッション確立成功
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // リダイレクト先の URL を構築
      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${requestUrl.origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${requestUrl.origin}${next}`;
      }

      console.log('[Auth Callback] Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // エラーの場合
    console.error('[Auth Callback] Failed to exchange code:', error);
  } else {
    console.error('[Auth Callback] No code in URL');
  }

  // code がない、またはエラーの場合はログインページにリダイレクト
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
