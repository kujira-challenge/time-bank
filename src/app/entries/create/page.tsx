import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EntryCreateForm from './EntryCreateForm';
import { getEvaluationAxes } from '@/lib/dashboard/aggregations';

export default async function EntriesCreatePage() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 現在のユーザーのプロフィールを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single();

  // 全ユーザー一覧を取得（recipient選択用）
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('active', true)
    .order('display_name');

  // 評価軸マスタデータを取得
  const evaluationAxes = await getEvaluationAxes();

  const displayName = profile?.display_name || 'ユーザー';
  const email = profile?.email || user.email;

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
            displayName={displayName}
            email={email || ''}
            allUsers={allUsers || []}
            evaluationAxes={evaluationAxes}
          />
        </div>
      </div>
    </div>
  );
}
