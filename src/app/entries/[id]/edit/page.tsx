import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import EntryCreateForm from '../../create/EntryCreateForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntryEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // エントリを取得
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single();

  if (entryError || !entry) {
    notFound();
  }

  // 全ユーザー一覧を取得
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('active', true)
    .order('display_name');

  // エントリの受信者を取得
  const { data: recipients } = await supabase
    .from('entry_recipients')
    .select('recipient_id, recipient_type')
    .eq('entry_id', id);

  const initialRecipients = (recipients || []).map((r) => ({
    recipient_id: r.recipient_id as string,
    recipient_type: r.recipient_type as 'user' | 'guild',
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/entries" className="text-blue-600 hover:text-blue-800">
            ← 一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">時間銀行エントリ編集</h1>

          <EntryCreateForm
            currentUserId={user.id}
            allUsers={allUsers || []}
            mode="edit"
            initialData={entry}
            entryId={id}
            initialRecipients={initialRecipients}
          />
        </div>
      </div>
    </div>
  );
}
