import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  getUserWeeklyData,
  getTagDistribution,
  getTopContributors,
  getTopByValueScore,
  getKPIStats,
  getLatestQuarterlySummary,
  getEvaluationTrends,
  getRecentActivities,
} from '@/lib/dashboard/aggregations';
import { WeeklyLineChart, TagPieChart, TopContributorsBarChart } from './DashboardCharts';
import CSVExportButton from '@/components/CSVExportButton';
import DashboardStats from './DashboardStats';
import QuarterlySummaryCard from './QuarterlySummaryCard';
import EvaluationTrendsCard from './EvaluationTrendsCard';
import RecentActivitiesCard from './RecentActivitiesCard';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all dashboard data in parallel
  const [
    weeklyData,
    tagData,
    topContributors,
    topByValue,
    kpiStats,
    quarterlySummary,
    evaluationTrends,
    recentActivities,
  ] = await Promise.all([
    getUserWeeklyData(user.id, 12),
    getTagDistribution(10),
    getTopContributors(10),
    getTopByValueScore(10),
    getKPIStats(user.id),
    getLatestQuarterlySummary(user.id),
    getEvaluationTrends(user.id),
    getRecentActivities(5),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← ホームに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">ダッシュボード</h1>
            <p className="text-gray-600 mt-1">時間銀行の可視化と分析</p>
          </div>
          <CSVExportButton />
        </div>

        {/* 1. KPIカードエリア（5枚・横並び） */}
        <DashboardStats stats={kpiStats} />

        {/* 2. 最新クォータリーリフレクションのサマリーカード */}
        <QuarterlySummaryCard summary={quarterlySummary} />

        {/* 3. 評価傾向（10評価軸・チャート切替） */}
        <EvaluationTrendsCard trends={evaluationTrends} />

        {/* 4. グラフエリア（時間推移・配分・プロジェクト別） */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Weekly Progress */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">週次推移</h2>
            <WeeklyLineChart data={weeklyData} />
          </div>

          {/* Tag Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">タグ別割合</h2>
            <TagPieChart data={tagData} />
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">全体TOP10（時間数）</h2>
          <TopContributorsBarChart data={topContributors} />
        </div>

        {/* 5. 最近の活動（最新5件） */}
        <RecentActivitiesCard activities={recentActivities} />

        {/* Monthly Rankings Tables */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Hours Ranking */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">月次ランキング（時間）</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">順位</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topContributors.map((user, idx) => (
                    <tr key={user.userId} className={idx < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {idx + 1 === 1 && '🥇'}
                        {idx + 1 === 2 && '🥈'}
                        {idx + 1 === 3 && '🥉'}
                        {idx >= 3 && idx + 1}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{user.displayName}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right font-semibold">
                        {user.totalHours.toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Value Score Ranking */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">月次ランキング（価値スコア）</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">順位</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">スコア</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topByValue.map((user, idx) => (
                    <tr key={user.userId} className={idx < 3 ? 'bg-purple-50' : ''}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {idx + 1 === 1 && '🥇'}
                        {idx + 1 === 2 && '🥈'}
                        {idx + 1 === 3 && '🥉'}
                        {idx >= 3 && idx + 1}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {user.displayName}
                        <span className="ml-2 text-xs text-gray-500">
                          {user.avgRating > 0 && `⭐${user.avgRating.toFixed(1)}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right font-semibold">
                        {user.valueScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
