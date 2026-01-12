import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EntryCreateForm from './EntryCreateForm';

export default async function EntriesCreatePage() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 全ユーザー一覧を取得
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('active', true)
    .order('display_name');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/entries" className="text-blue-600 hover:text-blue-800">
            ← 一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">時間銀行エントリ作成</h1>

          <EntryCreateForm
            currentUserId={user.id}
            allUsers={allUsers || []}
          />
        </div>
      </div>
    </div>
  );
}
