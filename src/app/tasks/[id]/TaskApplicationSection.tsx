'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, TaskApplication, Profile } from '@/types';
import { applyToTask, withdrawApplication } from '../actions';

type TaskApplicationWithProfile = TaskApplication & {
  applicant: Profile;
};

type TaskApplicationSectionProps = {
  taskId: string;
  taskStatus: Task['status'];
  isRequester: boolean;
  userApplication: TaskApplication | undefined;
  applications: TaskApplicationWithProfile[];
};

export default function TaskApplicationSection({
  taskId,
  taskStatus,
  isRequester,
  userApplication,
  applications,
}: TaskApplicationSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    setIsSubmitting(true);
    const result = await applyToTask(taskId);

    if (!result.success) {
      alert(`エラー: ${result.error}`);
      setIsSubmitting(false);
      return;
    }

    alert('応募しました');
    setIsSubmitting(false);
    router.refresh();
  };

  const handleWithdraw = async () => {
    if (!userApplication) return;

    setIsSubmitting(true);
    const result = await withdrawApplication(userApplication.id);

    if (!result.success) {
      alert(`エラー: ${result.error}`);
      setIsSubmitting(false);
      return;
    }

    alert('応募を取り下げました');
    setIsSubmitting(false);
    router.refresh();
  };

  const appliedApplications = applications.filter((app) => app.status === 'applied');

  return (
    <div className="border-t pt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">応募状況</h2>

      {/* 応募ボタン（依頼者以外） */}
      {!isRequester && (
        <div className="mb-6">
          {!userApplication ? (
            <button
              onClick={handleApply}
              disabled={isSubmitting || taskStatus !== 'open'}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                taskStatus === 'open'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {taskStatus === 'open' ? '応募する' : '募集終了'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md font-medium">
                応募済み
              </span>
              <button
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取り下げる
              </button>
            </div>
          )}
        </div>
      )}

      {/* 応募者一覧 */}
      {appliedApplications.length > 0 ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            応募者数: {appliedApplications.length}名
          </p>
          <div className="space-y-2">
            {appliedApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{app.applicant.display_name}</p>
                  <p className="text-xs text-gray-500">
                    応募日: {new Date(app.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">まだ応募者はいません</p>
      )}
    </div>
  );
}
