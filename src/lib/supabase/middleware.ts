import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 公開ルート（認証不要）
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/forgot-password', '/reset-password'];

// 完全一致で公開するルート
const PUBLIC_EXACT_ROUTES = ['/'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションをリフレッシュ
  const { data: { user } } = await supabase.auth.getUser();

  // デバッグログ（一時的）
  console.log('[Middleware]', {
    pathname,
    hasUser: !!user,
    userId: user?.id,
  });

  // 公開ルート（前方一致）はそのまま通す
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 完全一致で公開するルート
  const isPublicExactRoute = PUBLIC_EXACT_ROUTES.includes(pathname);

  if (isPublicRoute || isPublicExactRoute) {
    return supabaseResponse;
  }

  // 保護ルートで未認証の場合は /login へリダイレクト
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーの active チェック（招待制の強制）
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active')
    .eq('id', user.id)
    .single();

  // デバッグログ（一時的）
  console.log('[Middleware] Profile check:', {
    hasProfile: !!profile,
    active: profile?.active,
    error: profileError?.message,
  });

  // プロフィールが見つからない場合は、トリガーで作成中の可能性があるため、
  // 一度だけスルーする（新規ユーザーの初回ログイン時）
  if (!profile) {
    // プロフィールが存在しない場合は警告ログを出すが、通す
    console.warn('[Middleware] Profile not found for user:', user.id, '- allowing access (may be creating)');
    return supabaseResponse;
  }

  // プロフィールが存在するが active = false の場合は弾く
  if (profile.active === false) {
    console.warn('[Middleware] User is inactive:', user.id);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('msg', 'not_invited');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
