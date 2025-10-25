import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

/**
 * 現在ログイン中のSupabaseユーザーを表示するコンポーネント
 *
 * 認証済みユーザーの表示名とメールアドレスを表示します。
 * ユーザーの切り替え機能はありません（常に自分のみ）。
 */
export default async function CurrentUserDisplay() {
  const supabase = await createClient();

  // 認証済みユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証の場合は何も表示しない
  if (!user) {
    return null;
  }

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || 'ユーザー';
  const email = profile?.email || user.email;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">現在の利用者:</span>
          <Link
            href="/mypage"
            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
          >
            {displayName}
          </Link>
        </div>
        <span className="text-xs text-gray-500">({email})</span>
      </div>
      <LogoutButton />
    </div>
  );
}
