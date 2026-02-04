import { createClient } from '@/lib/supabase/server';
import type { QuarterlySummary, EvaluationAxisScore, EvaluationAxis } from '@/types';

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
  recipient_names: string[];
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

  // 受け取った時間（entry_recipients で自分が recipient のエントリ）
  const { data: receivedRecipients } = await supabase
    .from('entry_recipients')
    .select('entry_id')
    .eq('recipient_id', userId)
    .eq('recipient_type', 'user');

  let receivedHours = 0;
  if (receivedRecipients && receivedRecipients.length > 0) {
    const entryIds = receivedRecipients.map((r) => r.entry_id);
    const { data: receivedEntries } = await supabase
      .from('entries')
      .select('hours')
      .in('id', entryIds);

    receivedHours = receivedEntries?.reduce((sum, e) => sum + e.hours, 0) || 0;
  }

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

  // 協働メンバー数（entry_recipients ベースで算出）
  // 自分が contributor のエントリの受信者（user タイプ）
  const { data: myEntries } = await supabase
    .from('entries')
    .select('id')
    .eq('contributor_id', userId);

  const collaborators = new Set<string>();

  if (myEntries && myEntries.length > 0) {
    const myEntryIds = myEntries.map((e) => e.id);
    const { data: myRecipients } = await supabase
      .from('entry_recipients')
      .select('recipient_id')
      .in('entry_id', myEntryIds)
      .eq('recipient_type', 'user');

    myRecipients?.forEach((r) => collaborators.add(r.recipient_id));
  }

  // 自分が受信者のエントリの contributor
  if (receivedRecipients && receivedRecipients.length > 0) {
    const receivedEntryIds = receivedRecipients.map((r) => r.entry_id);
    const { data: contributors } = await supabase
      .from('entries')
      .select('contributor_id')
      .in('id', receivedEntryIds);

    contributors?.forEach((e) => collaborators.add(e.contributor_id));
  }

  // 自分自身を除外
  collaborators.delete(userId);

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
      contributor:profiles!entries_contributor_id_fkey(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!entries) {
    return [];
  }

  // Fetch recipients for all entries in batch
  const entryIds = entries.map((e: Record<string, unknown>) => e.id as string);
  const { data: allRecipients } = await supabase
    .from('entry_recipients')
    .select('entry_id, recipient_id, recipient_type')
    .in('entry_id', entryIds);

  // Collect unique recipient IDs by type
  const userIds = new Set<string>();
  const guildIds = new Set<string>();
  allRecipients?.forEach((r) => {
    if (r.recipient_type === 'user') userIds.add(r.recipient_id);
    if (r.recipient_type === 'guild') guildIds.add(r.recipient_id);
  });

  // Fetch user and guild names
  const nameMap = new Map<string, string>();

  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', Array.from(userIds));
    users?.forEach((u) => nameMap.set(u.id, u.display_name));
  }

  if (guildIds.size > 0) {
    const { data: guilds } = await supabase
      .from('guilds')
      .select('id, name')
      .in('id', Array.from(guildIds));
    guilds?.forEach((g) => nameMap.set(g.id, g.name));
  }

  // Build a map of entry_id -> recipient names
  const recipientsByEntry = new Map<string, string[]>();
  allRecipients?.forEach((r) => {
    const names = recipientsByEntry.get(r.entry_id) || [];
    const prefix = r.recipient_type === 'guild' ? '(組織) ' : '';
    names.push(prefix + (nameMap.get(r.recipient_id) || 'Unknown'));
    recipientsByEntry.set(r.entry_id, names);
  });

  return entries.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    week_start: e.week_start as string,
    hours: e.hours as number,
    tags: (e.tags as string[]) || [],
    note: (e.note as string) || '',
    contributor_name: ((e.contributor as { display_name?: string } | null)?.display_name) || 'Unknown',
    recipient_names: recipientsByEntry.get(e.id as string) || [],
    created_at: e.created_at as string,
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
