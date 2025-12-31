import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Task, Profile } from '@/types';

type TaskWithProfiles = Task & {
  requester: Profile;
  assignee: Profile | null;
};

export default async function TasksPage() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // タスク一覧を取得（依頼者と担当者の情報も結合）
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      requester:profiles!tasks_requester_id_fkey(*),
      assignee:profiles!tasks_assignee_id_fkey(*)
    `
    )
    .is('deleted_at', null) // 論理削除されていないもののみ
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch tasks:', error);
  }

  const tasksWithProfiles = (tasks || []) as unknown as TaskWithProfiles[];

  // ステータス別にグループ化
  const openTasks = tasksWithProfiles.filter((t) => t.status === 'open');
  const inProgressTasks = tasksWithProfiles.filter((t) => t.status === 'in_progress');
  const completedTasks = tasksWithProfiles.filter((t) => t.status === 'completed');
  const cancelledTasks = tasksWithProfiles.filter((t) => t.status === 'cancelled');

  const getStatusBadgeClass = (status: Task['status']) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'open':
        return '募集中';
      case 'in_progress':
        return '進行中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const TaskCard = ({ task }: { task: TaskWithProfiles }) => (
    <Link
      href={`/tasks/${task.id}`}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {task.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="space-y-1">
          <p>
            依頼者: <span className="font-medium">{task.requester.display_name}</span>
          </p>
          {task.assignee && (
            <p>
              担当者: <span className="font-medium">{task.assignee.display_name}</span>
            </p>
          )}
          {task.estimated_hours && (
            <p>
              想定時間: <span className="font-medium">{task.estimated_hours}時間</span>
            </p>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(task.created_at).toLocaleDateString('ja-JP')}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← ホームに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">タスク依頼一覧</h1>
          </div>
          <Link
            href="/tasks/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + 新規作成
          </Link>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">募集中</p>
            <p className="text-2xl font-bold text-blue-600">{openTasks.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">進行中</p>
            <p className="text-2xl font-bold text-yellow-600">{inProgressTasks.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">完了</p>
            <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">キャンセル</p>
            <p className="text-2xl font-bold text-gray-600">{cancelledTasks.length}</p>
          </div>
        </div>

        {tasksWithProfiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">タスク依頼がありません</p>
            <Link
              href="/tasks/create"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              最初のタスクを作成
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 募集中 */}
            {openTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">募集中</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* 進行中 */}
            {inProgressTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">進行中</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* 完了 */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">完了</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* キャンセル */}
            {cancelledTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">キャンセル</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cancelledTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
