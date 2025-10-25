import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function MyPage() {
  const supabase = await createClient();

  // ユーザー情報を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインの場合はログインページにリダイレクト
  if (!user) {
    redirect('/login');
  }

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

          <div className="space-y-6">
            {/* プロフィール情報 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">プロフィール情報</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">表示名</label>
                  <p className="mt-1 text-lg text-gray-900">
                    {profile?.display_name || 'ユーザー'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ユーザーID</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">{user.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">登録日時</label>
                  <p className="mt-1 text-sm text-gray-500">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleString('ja-JP')
                      : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ステータス</label>
                  <span
                    className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${
                      profile?.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile?.active ? 'アクティブ' : '非アクティブ'}
                  </span>
                </div>
              </div>
            </div>

            {/* 認証情報 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">認証情報</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">認証プロバイダー</label>
                  <p className="mt-1 text-gray-900">Magic Link (メール認証)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">最終ログイン</label>
                  <p className="mt-1 text-sm text-gray-500">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString('ja-JP')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* アクション */}
            <div className="pt-4">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* 開発用情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">開発用情報</h3>
            <pre className="text-xs text-yellow-800 overflow-x-auto">
              {JSON.stringify({ user, profile }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
