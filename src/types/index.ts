/**
 * プロフィール型定義（Supabase用）
 */
export type Profile = {
  id: string;          // UUID (auth.users.id)
  display_name: string;
  email: string;
  active: boolean;
  created_at: string;  // ISO 8601形式
  updated_at: string;  // ISO 8601形式
};

/**
 * 時間銀行のエントリ型定義（Supabase用）
 */
export type EntryDB = {
  id: string;          // UUID
  week_start: string;  // YYYY-MM-DD形式の週開始日
  hours: number;
  tags: string[];
  note: string;
  contributor_id: string; // UUID (profiles.id)
  created_at: string;     // ISO 8601形式
  updated_at: string;     // ISO 8601形式
};

/**
 * タスク依頼型定義（Supabase用）
 */
export type Task = {
  id: string;              // UUID
  title: string;
  description: string;
  tags: string[];
  estimated_hours: number | null;
  requester_id: string;    // UUID (profiles.id)
  assignee_id: string | null; // UUID (profiles.id) or null
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;      // ISO 8601形式
  updated_at: string;      // ISO 8601形式
};

/**
 * タスク依頼作成用の入力型
 */
export type TaskInput = {
  title: string;
  description?: string;
  tags?: string[];
  estimated_hours?: number;
};

/**
 * Figmaテンプレートアイテム型定義
 */
export type TemplateItem = {
  key: 'kickoff' | 'ujm' | 'ia' | 'tips';
  label: string;
  kind: 'figma' | 'figjam';
  url: string;
  description?: string;
};
