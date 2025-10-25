import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/types';

export default async function UsersSettingsPage() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // プロフィール一覧を取得（display_nameでソート）
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, active')
    .order('display_name', { ascending: true });

  if (error) {
    console.error('Failed to fetch profiles:', error);
  }

  const profilesList = (profiles || []) as Profile[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              認証済みユーザーの一覧を閲覧できます（読み取り専用）
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              ℹ️ ユーザーの追加は管理者がSupabaseコンソールから招待する必要があります。
            </p>
          </div>

          {/* ユーザー一覧 */}
          <div className="space-y-4">
            {profilesList.map((profile) => (
              <div
                key={profile.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profile.display_name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          profile.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {profile.active ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{profile.email}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">ID: {profile.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {profilesList.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>ユーザーがいません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
