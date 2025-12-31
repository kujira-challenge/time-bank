'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/types';
import { updateTaskStatus, deleteTask } from '../actions';

type TaskManagementButtonsProps = {
  task: Task;
};

export default function TaskManagementButtons({ task }: TaskManagementButtonsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsUpdating(true);
    const result = await updateTaskStatus(task.id, newStatus);

    if (!result.success) {
      alert(`エラー: ${result.error}`);
      setIsUpdating(false);
      return;
    }

    alert('ステータスを更新しました');
    setIsUpdating(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    const result = await deleteTask(task.id);

    if (!result.success) {
      alert(`エラー: ${result.error}`);
      setIsUpdating(false);
      return;
    }

    alert('タスクを削除しました');
    router.push('/tasks');
  };

  return (
    <div className="border-t pt-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">タスク管理（依頼者のみ）</h2>

      <div className="space-y-4">
        {/* ステータス変更ボタン */}
        <div>
          <p className="text-sm text-gray-600 mb-2">ステータス変更:</p>
          <div className="flex flex-wrap gap-2">
            {task.status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                完了にする
              </button>
            )}
            {task.status !== 'cancelled' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={isUpdating}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取り下げる
              </button>
            )}
            {task.status === 'cancelled' && (
              <button
                onClick={() => handleStatusChange('open')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                再募集する
              </button>
            )}
          </div>
        </div>

        {/* 削除ボタン */}
        <div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除する
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-red-600 font-medium">本当に削除しますか？</p>
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                削除確定
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
