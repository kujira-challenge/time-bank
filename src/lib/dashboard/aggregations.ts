import { createClient } from '@/lib/supabase/server';

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
