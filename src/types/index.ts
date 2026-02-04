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
  week_start: string;  // YYYY-MM-DD形式の活動日
  hours: number;
  tags: string[];
  note: string;
  contributor_id: string; // UUID (profiles.id)
  recipient_id: string | null; // UUID (profiles.id) - レガシー（entry_recipientsに移行済み）
  created_at: string;     // ISO 8601形式
  updated_at: string;     // ISO 8601形式
};

/**
 * ギルド（組織）型定義（Supabase用）
 */
export type Guild = {
  id: string;          // UUID
  name: string;
  description: string;
  created_at: string;  // ISO 8601形式
  updated_at: string;  // ISO 8601形式
};

/**
 * 貢献先の種別
 */
export type RecipientType = 'user' | 'guild';

/**
 * エントリ受信者（中間テーブル）型定義
 */
export type EntryRecipient = {
  id: string;              // UUID
  entry_id: string;        // UUID (entries.id)
  recipient_id: string;    // UUID (profiles.id or guilds.id)
  recipient_type: RecipientType;
  created_at: string;      // ISO 8601形式
};

/**
 * 受信者の表示用型（UI向け）
 */
export type RecipientOption = {
  id: string;
  name: string;
  type: RecipientType;
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
  deleted_at: string | null; // ISO 8601形式 or null (soft delete)
  created_at: string;      // ISO 8601形式
  updated_at: string;      // ISO 8601形式
};

/**
 * タスク応募型定義（Supabase用）
 */
export type TaskApplication = {
  id: string;              // UUID
  task_id: string;         // UUID (tasks.id)
  applicant_id: string;    // UUID (profiles.id)
  status: 'applied' | 'withdrawn';
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

/**
 * 評価軸の型定義
 */
export type EvaluationAxisKey =
  | 'exceeding_expectations'
  | 'visualization'
  | 'new_perspective'
  | 'active_listening'
  | 'introduction'
  | 'verbalization'
  | 'new_world'
  | 'support'
  | 'collaboration'
  | 'mentoring';

export type EvaluationAxis = {
  id: number;
  axis_key: EvaluationAxisKey;
  axis_label: string;
  display_order: number;
  created_at: string;
};

/**
 * 詳細評価型定義
 */
export type DetailedEvaluation = {
  id: string;
  entry_id: string;
  evaluator_id: string;
  evaluated_id: string;
  axis_key: EvaluationAxisKey;
  score: number; // 1-5
  comment: string;
  created_at: string;
  updated_at: string;
};

/**
 * クォータリーリフレクション型定義
 */
export type QuarterlyReflection = {
  id: string;
  user_id: string;
  quarter_start: string; // YYYY-MM-DD形式
  quarter_end: string;   // YYYY-MM-DD形式
  achievement_rate: number; // 0-100
  avg_peer_rating: number;  // 0-5
  avg_goal_rating: number;  // 0-5
  created_at: string;
  updated_at: string;
};

/**
 * クォータリーアクション型定義
 */
export type QuarterlyAction = {
  id: string;
  quarterly_reflection_id: string;
  action_text: string;
  deadline: string | null; // YYYY-MM-DD形式
  created_at: string;
  updated_at: string;
};

/**
 * クォータリーサマリー（リフレクション+アクション）
 */
export type QuarterlySummary = QuarterlyReflection & {
  actions: QuarterlyAction[];
};

/**
 * 評価軸別のスコア集計
 */
export type EvaluationAxisScore = {
  axis_key: EvaluationAxisKey;
  axis_label: string;
  avg_score: number; // 平均スコア 0-5
  count: number;     // 評価件数
};

/**
 * 評価アイテム（フォーム入力用）
 */
export type EvaluationItem = {
  axis_key: EvaluationAxisKey;
  score: number; // 1-5
  comment: string;
};
