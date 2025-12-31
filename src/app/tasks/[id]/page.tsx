import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Task, Profile, TaskApplication } from '@/types';
import TaskManagementButtons from './TaskManagementButtons';
import TaskApplicationSection from './TaskApplicationSection';

type TaskWithProfiles = Task & {
  requester: Profile;
  assignee: Profile | null;
};

type TaskApplicationWithProfile = TaskApplication & {
  applicant: Profile;
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // タスク詳細を取得
  const { data: task, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      requester:profiles!tasks_requester_id_fkey(*),
      assignee:profiles!tasks_assignee_id_fkey(*)
    `
    )
    .eq('id', id)
    .is('deleted_at', null) // 論理削除されていないもののみ
    .single();

  if (error || !task) {
    notFound();
  }

  const taskWithProfiles = task as unknown as TaskWithProfiles;

  // 応募一覧を取得
  const { data: applications } = await supabase
    .from('task_applications')
    .select(
      `
      *,
      applicant:profiles!task_applications_applicant_id_fkey(*)
    `
    )
    .eq('task_id', id)
    .order('created_at', { ascending: false });

  const applicationsWithProfiles = (applications || []) as unknown as TaskApplicationWithProfile[];

  // 現在のユーザーの応募状況を確認
  const userApplication = applicationsWithProfiles.find(
    (app) => app.applicant_id === user.id && app.status === 'applied'
  );

  const isRequester = taskWithProfiles.requester_id === user.id;

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm">
            ← タスク一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{taskWithProfiles.title}</h1>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(taskWithProfiles.status)}`}
                >
                  {getStatusLabel(taskWithProfiles.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                作成日: {new Date(taskWithProfiles.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-6 mb-8">
            {taskWithProfiles.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">詳細説明</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{taskWithProfiles.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">依頼者</h3>
                <p className="text-gray-900">{taskWithProfiles.requester.display_name}</p>
              </div>

              {taskWithProfiles.assignee && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">担当者</h3>
                  <p className="text-gray-900">{taskWithProfiles.assignee.display_name}</p>
                </div>
              )}

              {taskWithProfiles.estimated_hours && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">想定時間</h3>
                  <p className="text-gray-900">{taskWithProfiles.estimated_hours}時間</p>
                </div>
              )}
            </div>

            {taskWithProfiles.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {taskWithProfiles.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 管理ボタン（依頼者のみ） */}
          {isRequester && <TaskManagementButtons task={taskWithProfiles} />}

          {/* 応募セクション */}
          <TaskApplicationSection
            taskId={id}
            taskStatus={taskWithProfiles.status}
            isRequester={isRequester}
            userApplication={userApplication}
            applications={applicationsWithProfiles}
          />
        </div>
      </div>
    </div>
  );
}
