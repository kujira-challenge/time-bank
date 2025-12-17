import { createClient } from '@/lib/supabase/server';
import type { QuarterlySummary, EvaluationAxisScore, EvaluationAxis, EntryDB } from '@/types';

export type WeeklyData = {
  week: string;
  hours: number;
};

export type TagData = {
  tag: string;
  hours: number;
};

export type UserRanking = {
  userId: string;
  displayName: string;
  totalHours: number;
  avgRating: number;
  feedbackCount: number;
  valueScore: number;
};

export type KPIStats = {
  providedHours: number;      // 提供した時間
  receivedHours: number;      // 受け取った時間
  balanceHours: number;       // 時間収支
  balanceLabel: string;       // 収支ラベル（提供超過/受取超過/収支均衡）
  avgRating: number;          // 平均評価
  collaboratorCount: number;  // 協働メンバー数
};

export type RecentActivity = {
  id: string;
  week_start: string;
  hours: number;
  tags: string[];
  note: string;
  contributor_name: string;
  recipient_name: string | null;
  created_at: string;
};

/**
 * Get weekly hours progression for a specific user
 */
export async function getUserWeeklyData(userId: string, limit: number = 12): Promise<WeeklyData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc('get_user_weekly_hours', {
      p_user_id: userId,
      p_limit: limit,
    });

  if (error) {
    console.error('Error fetching weekly data:', error);
    return [];
  }

  return (data || []) as WeeklyData[];
}

/**
 * Get tag distribution across all entries
 */
export async function getTagDistribution(limit: number = 10): Promise<TagData[]> {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from('entries')
    .select('tags, hours');

  if (!entries) return [];

  // Aggregate tags
  const tagMap = new Map<string, number>();
  entries.forEach((entry) => {
    entry.tags.forEach((tag: string) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + entry.hours);
    });
  });

  // Convert to array and sort
  const tagData = Array.from(tagMap.entries())
    .map(([tag, hours]) => ({ tag, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);

  return tagData;
}

/**
 * Get top contributors by hours
 */
export async function getTopContributors(limit: number = 10): Promise<UserRanking[]> {
  const supabase = await createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await supabase
    .from('monthly_value_scores')
    .select('*')
    .eq('month', currentMonth + '-01')
    .order('total_hours', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top contributors:', error);
    return [];
  }

  return (data || []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    totalHours: row.total_hours || 0,
    avgRating: row.avg_rating || 0,
    feedbackCount: row.feedback_count || 0,
    valueScore: row.value_score || 0,
  }));
}

/**
 * Get top by value score
 */
export async function getTopByValueScore(limit: number = 10): Promise<UserRanking[]> {
  const supabase = await createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await supabase
    .from('monthly_value_scores')
    .select('*')
    .eq('month', currentMonth + '-01')
    .order('value_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top by value score:', error);
    return [];
  }

  return (data || []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    totalHours: row.total_hours || 0,
    avgRating: row.avg_rating || 0,
    feedbackCount: row.feedback_count || 0,
    valueScore: row.value_score || 0,
  }));
}

/**
 * Get user's value score stats
 */
export async function getUserValueScore(userId: string) {
  const supabase = await createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data } = await supabase
    .from('monthly_value_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth + '-01')
    .single();

  return data
    ? {
        totalHours: data.total_hours || 0,
        avgRating: data.avg_rating || 0,
        feedbackCount: data.feedback_count || 0,
        valueScore: data.value_score || 0,
      }
    : {
        totalHours: 0,
        avgRating: 0,
        feedbackCount: 0,
        valueScore: 0,
      };
}

/**
 * Get KPI statistics for dashboard
 */
export async function getKPIStats(userId: string): Promise<KPIStats> {
  const supabase = await createClient();

  // 提供した時間（自分が contributor のエントリ）
  const { data: providedEntries } = await supabase
    .from('entries')
    .select('hours')
    .eq('contributor_id', userId);

  const providedHours = providedEntries?.reduce((sum, e) => sum + e.hours, 0) || 0;

  // 受け取った時間（自分が recipient のエントリ）
  const { data: receivedEntries } = await supabase
    .from('entries')
    .select('hours')
    .eq('recipient_id', userId);

  const receivedHours = receivedEntries?.reduce((sum, e) => sum + e.hours, 0) || 0;

  // 時間収支
  const balanceHours = providedHours - receivedHours;
  let balanceLabel = '収支均衡';
  if (balanceHours > 0) {
    balanceLabel = '提供超過';
  } else if (balanceHours < 0) {
    balanceLabel = '受取超過';
  }

  // 平均評価（自分が評価された detailed_evaluations）
  const { data: evaluations } = await supabase
    .from('detailed_evaluations')
    .select('score')
    .eq('evaluated_id', userId);

  const avgRating = evaluations && evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
    : 0;

  // 協働メンバー数（自分が contributor または recipient のエントリの相手）
  const { data: asContributor } = await supabase
    .from('entries')
    .select('recipient_id')
    .eq('contributor_id', userId)
    .not('recipient_id', 'is', null);

  const { data: asRecipient } = await supabase
    .from('entries')
    .select('contributor_id')
    .eq('recipient_id', userId);

  const collaborators = new Set<string>();
  asContributor?.forEach((e) => e.recipient_id && collaborators.add(e.recipient_id));
  asRecipient?.forEach((e) => collaborators.add(e.contributor_id));

  return {
    providedHours,
    receivedHours,
    balanceHours,
    balanceLabel,
    avgRating,
    collaboratorCount: collaborators.size,
  };
}

/**
 * Get latest quarterly reflection summary
 */
export async function getLatestQuarterlySummary(userId: string): Promise<QuarterlySummary | null> {
  const supabase = await createClient();

  // 最新のクォータリーリフレクションを取得
  const { data: reflection } = await supabase
    .from('quarterly_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('quarter_start', { ascending: false })
    .limit(1)
    .single();

  if (!reflection) {
    return null;
  }

  // 関連するアクションを取得
  const { data: actions } = await supabase
    .from('quarterly_actions')
    .select('*')
    .eq('quarterly_reflection_id', reflection.id)
    .order('deadline', { ascending: true })
    .limit(3);

  return {
    ...reflection,
    actions: actions || [],
  };
}

/**
 * Get evaluation trends (10 evaluation axes)
 */
export async function getEvaluationTrends(userId: string): Promise<EvaluationAxisScore[]> {
  const supabase = await createClient();

  // 評価軸マスタデータを取得
  const { data: axes } = await supabase
    .from('evaluation_axes')
    .select('*')
    .order('display_order', { ascending: true });

  if (!axes) {
    return [];
  }

  // ユーザーが受けた評価を取得
  const { data: evaluations } = await supabase
    .from('detailed_evaluations')
    .select('axis_key, score')
    .eq('evaluated_id', userId);

  // 評価軸ごとに集計
  const axisMap = new Map<string, { total: number; count: number }>();
  evaluations?.forEach((e) => {
    const existing = axisMap.get(e.axis_key) || { total: 0, count: 0 };
    axisMap.set(e.axis_key, {
      total: existing.total + e.score,
      count: existing.count + 1,
    });
  });

  return axes.map((axis) => {
    const stats = axisMap.get(axis.axis_key) || { total: 0, count: 0 };
    return {
      axis_key: axis.axis_key,
      axis_label: axis.axis_label,
      avg_score: stats.count > 0 ? stats.total / stats.count : 0,
      count: stats.count,
    };
  });
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      id,
      week_start,
      hours,
      tags,
      note,
      created_at,
      contributor:profiles!entries_contributor_id_fkey(display_name),
      recipient:profiles!entries_recipient_id_fkey(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!entries) {
    return [];
  }

  return entries.map((e: any) => ({
    id: e.id,
    week_start: e.week_start,
    hours: e.hours,
    tags: e.tags || [],
    note: e.note || '',
    contributor_name: e.contributor?.display_name || 'Unknown',
    recipient_name: e.recipient?.display_name || null,
    created_at: e.created_at,
  }));
}

/**
 * Get all evaluation axes
 */
export async function getEvaluationAxes(): Promise<EvaluationAxis[]> {
  const supabase = await createClient();

  const { data: axes } = await supabase
    .from('evaluation_axes')
    .select('*')
    .order('display_order', { ascending: true });

  return axes || [];
}
