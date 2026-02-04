'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EntryDB, Profile } from '@/types';

type EntryWithProfile = EntryDB & {
  contributor: Profile;
};

type RecipientInfo = {
  recipient_id: string;
  recipient_type: string;
  name: string;
};

type EntriesListClientProps = {
  entries: EntryWithProfile[];
  profiles: Pick<Profile, 'id' | 'display_name' | 'email'>[];
  currentUserId: string;
  recipientMap?: Record<string, RecipientInfo[]>;
};

export default function EntriesListClient({
  entries: initialEntries,
  profiles,
  currentUserId,
  recipientMap = {},
}: EntriesListClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [entries, setEntries] = useState(initialEntries);
  const [filterWeekStart, setFilterWeekStart] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterContributorId, setFilterContributorId] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // すべてのタグを収集
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // 一意な日付を収集
  const uniqueWeekStarts = useMemo(() => {
    const weekSet = new Set(entries.map((e) => e.week_start));
    return Array.from(weekSet).sort().reverse();
  }, [entries]);

  // フィルタリング
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (showOnlyMine) {
      filtered = filtered.filter((e) => e.contributor_id === currentUserId);
    }

    if (filterWeekStart) {
      filtered = filtered.filter((e) => e.week_start === filterWeekStart);
    }

    if (filterTag) {
      filtered = filtered.filter((e) => e.tags.includes(filterTag));
    }

    if (filterContributorId) {
      filtered = filtered.filter((e) => e.contributor_id === filterContributorId);
    }

    return filtered;
  }, [entries, filterWeekStart, filterTag, filterContributorId, showOnlyMine, currentUserId]);

  const handleDelete = async (id: string) => {
    if (!confirm('このエントリを削除しますか?')) {
      return;
    }

    try {
      const { error } = await supabase.from('entries').delete().eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        alert(`削除に失敗しました: ${error.message}`);
        return;
      }

      // 成功したらローカル状態を更新
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <>
      {/* フィルタ */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showOnlyMine"
            checked={showOnlyMine}
            onChange={(e) => setShowOnlyMine(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showOnlyMine" className="text-sm font-medium text-gray-700">
            自分のエントリのみ表示
          </label>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterWeekStart" className="block text-sm font-medium text-gray-700 mb-2">
              日付でフィルタ
            </label>
            <select
              id="filterWeekStart"
              value={filterWeekStart}
              onChange={(e) => setFilterWeekStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {uniqueWeekStarts.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterTag" className="block text-sm font-medium text-gray-700 mb-2">
              タグでフィルタ
            </label>
            <select
              id="filterTag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterContributor" className="block text-sm font-medium text-gray-700 mb-2">
              貢献者でフィルタ
            </label>
            <select
              id="filterContributor"
              value={filterContributorId}
              onChange={(e) => setFilterContributorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* エントリ一覧 */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>エントリがありません</p>
          <Link href="/entries/create" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            最初のエントリを作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const recipients = recipientMap[entry.id] || [];
            return (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-semibold text-gray-900">{entry.hours}時間</span>
                      <span className="text-sm text-gray-500">日付: {entry.week_start}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {entry.contributor.display_name}
                      </span>
                      {entry.contributor_id === currentUserId && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          自分
                        </span>
                      )}
                    </div>

                    {/* Recipients */}
                    {recipients.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-gray-500">貢献先:</span>
                        {recipients.map((r) => (
                          <span
                            key={`${r.recipient_type}-${r.recipient_id}`}
                            className={`px-2 py-1 text-xs rounded-full ${
                              r.recipient_type === 'guild'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entry.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.note && <p className="text-gray-700 text-sm mb-2">{entry.note}</p>}

                    <p className="text-xs text-gray-400">
                      作成日時: {new Date(entry.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/entries/${entry.id}/edit`}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
