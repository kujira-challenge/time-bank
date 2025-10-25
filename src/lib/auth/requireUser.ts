import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * サーバーサイドで認証済みユーザーを要求するユーティリティ
 * API RouteやServer Actionsで使用
 *
 * @throws {Error} 未認証の場合は'UNAUTHORIZED'エラーをスロー
 * @returns {Promise<{ supabase, user }>} SupabaseクライアントとUserオブジェクト
 */
export async function requireUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }

  return { supabase, user };
}

/**
 * 認証済みユーザーのIDを取得する簡易ヘルパー
 *
 * @throws {Error} 未認証の場合は'UNAUTHORIZED'エラーをスロー
 * @returns {Promise<string>} ユーザーID
 */
export async function requireUserId(): Promise<string> {
  const { user } = await requireUser();
  return user.id;
}

/**
 * 認証済みユーザーを取得（エラーをスローしない版）
 *
 * @returns {Promise<User | null>} Userオブジェクトまたはnull
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await requireUser();
    return user;
  } catch {
    return null;
  }
}
