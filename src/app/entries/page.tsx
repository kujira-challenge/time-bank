import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EntriesListClient from './EntriesListClient';
import type { EntryDB, Profile } from '@/types';

type EntryWithProfile = EntryDB & {
  contributor: Profile;
};

export default async function EntriesPage() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // エントリ一覧を取得（貢献者の情報も結合）
  const { data: entries, error } = await supabase
    .from('entries')
    .select(
      `
      *,
      contributor:profiles!entries_contributor_id_fkey(*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch entries:', error);
  }

  const entriesWithProfiles = (entries || []) as unknown as EntryWithProfile[];

  // すべてのプロフィールを取得（フィルタ用）
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('active', true)
    .order('display_name', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">時間銀行エントリ一覧</h1>
            <Link
              href="/entries/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + 新規作成
            </Link>
          </div>

          <EntriesListClient
            entries={entriesWithProfiles}
            profiles={profiles || []}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
