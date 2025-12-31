'use server';

import { requireUser } from '@/lib/auth/requireUser';
import { revalidatePath } from 'next/cache';

/**
 * タスクのステータスを更新する
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: 'open' | 'in_progress' | 'completed' | 'cancelled'
) {
  try {
    const { supabase, user } = await requireUser();

    // タスクの所有者確認（依頼者のみ更新可能）
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('requester_id')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    if (task.requester_id !== user.id) {
      return { success: false, error: '権限がありません（依頼者のみ更新可能）' };
    }

    // ステータスを更新
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * タスクを論理削除する
 */
export async function deleteTask(taskId: string) {
  try {
    const { supabase, user } = await requireUser();

    // タスクの所有者確認（依頼者のみ削除可能）
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('requester_id')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    if (task.requester_id !== user.id) {
      return { success: false, error: '権限がありません（依頼者のみ削除可能）' };
    }

    // 論理削除（deleted_atに現在時刻を設定）
    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * タスクに応募する
 */
export async function applyToTask(taskId: string) {
  try {
    const { supabase, user } = await requireUser();

    // タスクが存在し、募集中であることを確認
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status, deleted_at')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'タスクが見つかりません' };
    }

    if (task.deleted_at) {
      return { success: false, error: 'このタスクは削除されています' };
    }

    if (task.status !== 'open') {
      return { success: false, error: 'このタスクは現在募集していません' };
    }

    // 応募レコードを作成
    const { error: insertError } = await supabase
      .from('task_applications')
      .insert({
        task_id: taskId,
        applicant_id: user.id,
        status: 'applied',
      });

    if (insertError) {
      // UNIQUE制約違反の場合は既に応募済み
      if (insertError.code === '23505') {
        return { success: false, error: '既に応募済みです' };
      }
      return { success: false, error: insertError.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * 応募を取り下げる
 */
export async function withdrawApplication(applicationId: string) {
  try {
    const { supabase, user } = await requireUser();

    // 応募レコードの所有者確認
    const { data: application, error: fetchError } = await supabase
      .from('task_applications')
      .select('applicant_id')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return { success: false, error: '応募が見つかりません' };
    }

    if (application.applicant_id !== user.id) {
      return { success: false, error: '権限がありません' };
    }

    // ステータスを withdrawn に更新
    const { error: updateError } = await supabase
      .from('task_applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
