'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TagMultiSelect from '@/components/TagMultiSelect';
import { createEntry, updateEntry, getAllTags } from '../actions';
import { formatDateISO } from '@/lib/validation/schemas';
// import DetailedEvaluationSection from './DetailedEvaluationSection'; // 一時的に未使用
import type { EvaluationAxis, EvaluationItem, EntryDB } from '@/types';

type UserOption = {
  id: string;
  display_name: string;
};

type EntryCreateFormProps = {
  currentUserId: string;
  allUsers: UserOption[];
  evaluationAxes?: EvaluationAxis[]; // 一時的に未使用（recipient撤去のため）
  mode?: 'create' | 'edit';
  initialData?: Partial<EntryDB>;
  entryId?: string;
};

export default function EntryCreateForm({
  currentUserId,
  allUsers,
  // evaluationAxes, // 一時的に未使用（recipient撤去のため）
  mode = 'create',
  initialData,
  entryId,
}: EntryCreateFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contributor_id: initialData?.contributor_id || currentUserId,
    week_start: initialData?.week_start || '',
    hours: initialData?.hours?.toString() || '',
    tags: initialData?.tags || ([] as string[]),
    note: initialData?.note || '',
    // recipient_id: '', // 一時的にUIから撤去（将来的に復活可能性あり）
  });
  const [detailedEvaluations] = useState<EvaluationItem[]>([]); // 一時的に未使用（recipient撤去のため）
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

    // Set default to today if creating new entry
    if (mode === 'create' && !formData.week_start) {
      const today = formatDateISO(new Date());
      setFormData((prev) => ({ ...prev, week_start: today }));
    }
  }, [mode, formData.week_start]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataObj = new FormData();
      formDataObj.append('contributor_id', formData.contributor_id);
      formDataObj.append('week_start', formData.week_start);
      formDataObj.append('hours', formData.hours);
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('note', formData.note);
      // recipient_id は一時的にUIから撤去（DB/API側ではnullを許容）
      formDataObj.append('recipient_id', '');
      formDataObj.append('detailed_evaluations', JSON.stringify(detailedEvaluations));

      const result = mode === 'create'
        ? await createEntry(formDataObj)
        : await updateEntry(entryId!, formDataObj);

      if (!result.success) {
        setError(result.error || `エントリの${mode === 'create' ? '作成' : '更新'}に失敗しました`);
        setIsSubmitting(false);
        return;
      }

      router.push('/entries');
      router.refresh();
    } catch (err) {
      setError(`エントリの${mode === 'create' ? '作成' : '更新'}中に予期しないエラーが発生しました`);
      console.error('Entry operation error:', err);
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
        {/* Contributor selector */}
        <div>
          <label htmlFor="contributor_id" className="block text-sm font-medium text-gray-700 mb-2">
            貢献者 <span className="text-red-500">*</span>
          </label>
          <select
            id="contributor_id"
            name="contributor_id"
            value={formData.contributor_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, contributor_id: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {allUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name} {user.id === currentUserId ? '(自分)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            自分または他の貢献者の名義でエントリを作成できます
          </p>
        </div>

        {/* Activity date */}
        <div>
          <label htmlFor="week_start" className="block text-sm font-medium text-gray-700 mb-2">
            活動日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="week_start"
            name="week_start"
            value={formData.week_start}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, week_start: e.target.value }));
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            活動した具体的な日付を選択してください
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

        {/* Recipient - 時間を受け取った相手（一時的にUIから撤去） */}
        {/*
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
        */}

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

        {/* 相手への詳細評価（任意）- recipient_id がUIから撤去されたため一時的に無効化 */}
        {/*
        {formData.recipient_id && (
          <DetailedEvaluationSection
            evaluationAxes={evaluationAxes}
            selectedEvaluations={detailedEvaluations}
            onChange={setDetailedEvaluations}
          />
        )}
        */}

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
            {isSubmitting ? `${mode === 'create' ? '作成' : '更新'}中...` : mode === 'create' ? '作成' : '更新'}
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
