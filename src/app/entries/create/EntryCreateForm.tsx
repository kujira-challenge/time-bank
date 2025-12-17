'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TagMultiSelect from '@/components/TagMultiSelect';
import { createEntry, getAllTags } from '../actions';
import { getMondayOfWeek, formatDateISO } from '@/lib/validation/schemas';
import DetailedEvaluationSection from './DetailedEvaluationSection';
import type { EvaluationAxis, EvaluationAxisKey } from '@/types';

type EvaluationItem = {
  axis_key: EvaluationAxisKey;
  score: number;
  comment: string;
};

type UserOption = {
  id: string;
  display_name: string;
};

type EntryCreateFormProps = {
  displayName: string;
  email: string;
  allUsers: UserOption[];
  evaluationAxes: EvaluationAxis[];
};

export default function EntryCreateForm({
  displayName,
  email,
  allUsers,
  evaluationAxes,
}: EntryCreateFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    week_start: '',
    hours: '',
    tags: [] as string[],
    note: '',
    recipient_id: '',
  });
  const [detailedEvaluations, setDetailedEvaluations] = useState<EvaluationItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch existing tags for suggestions
    getAllTags().then((result) => {
      if (result.success) {
        setTagSuggestions(result.tags);
      }
    });

    // Set default to this Monday
    const monday = getMondayOfWeek(new Date());
    setFormData((prev) => ({ ...prev, week_start: formatDateISO(monday) }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataObj = new FormData();
      formDataObj.append('week_start', formData.week_start);
      formDataObj.append('hours', formData.hours);
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('note', formData.note);
      formDataObj.append('recipient_id', formData.recipient_id);
      formDataObj.append('detailed_evaluations', JSON.stringify(detailedEvaluations));

      const result = await createEntry(formDataObj);

      if (!result.success) {
        setError(result.error || 'エントリの作成に失敗しました');
        setIsSubmitting(false);
        return;
      }

      router.push('/entries');
      router.refresh();
    } catch (err) {
      setError('エントリの作成中に予期しないエラーが発生しました');
      console.error('Entry creation error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contributor display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            貢献者 <span className="text-red-500">*</span>
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-medium">{displayName}</span>
              <span className="text-sm text-gray-500">({email})</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            自分のエントリのみ作成できます
          </p>
        </div>

        {/* Week start */}
        <div>
          <label htmlFor="week_start" className="block text-sm font-medium text-gray-700 mb-2">
            週開始日（月曜日） <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="week_start"
            name="week_start"
            value={formData.week_start}
            onChange={(e) => {
              // Auto-adjust to Monday
              const date = new Date(e.target.value + 'T00:00:00Z');
              const monday = getMondayOfWeek(date);
              setFormData((prev) => ({ ...prev, week_start: formatDateISO(monday) }));
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            月曜日以外を選択した場合、自動的に最も近い前の月曜日に補正されます
          </p>
        </div>

        {/* Hours */}
        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
            時間数 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="hours"
            name="hours"
            value={formData.hours}
            onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
            required
            step="0.5"
            min="0"
            max="100"
            placeholder="例: 8"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">0〜100時間の範囲で入力してください</p>
        </div>

        {/* Tags - Multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タグ（複数選択可）
          </label>
          <TagMultiSelect
            selectedTags={formData.tags}
            onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
            suggestions={tagSuggestions}
            placeholder="タグを入力してEnter"
            maxTags={10}
          />
        </div>

        {/* Recipient - 時間を受け取った相手 */}
        <div>
          <label htmlFor="recipient_id" className="block text-sm font-medium text-gray-700 mb-2">
            時間を受け取った相手（任意）
          </label>
          <select
            id="recipient_id"
            name="recipient_id"
            value={formData.recipient_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, recipient_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- 選択しない --</option>
            {allUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            この時間を誰のために提供したかを選択できます
          </p>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
            メモ
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="作業内容や特記事項など"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.note.length} / 1000 文字
          </p>
        </div>

        {/* 相手への詳細評価（任意） */}
        {formData.recipient_id && (
          <DetailedEvaluationSection
            evaluationAxes={evaluationAxes}
            selectedEvaluations={detailedEvaluations}
            onChange={setDetailedEvaluations}
          />
        )}

        {/* Submit */}
        <div className="pt-6 flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.week_start || !formData.hours}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              isSubmitting || !formData.week_start || !formData.hours
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? '作成中...' : '作成'}
          </button>

          <Link
            href="/entries"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
}
