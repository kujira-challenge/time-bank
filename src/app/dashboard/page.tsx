import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserWeeklyData, getTagDistribution, getTopContributors, getTopByValueScore, getUserValueScore } from '@/lib/dashboard/aggregations';
import { WeeklyLineChart, TagPieChart, TopContributorsBarChart } from './DashboardCharts';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all dashboard data in parallel
  const [weeklyData, tagData, topContributors, topByValue, userScore] = await Promise.all([
    getUserWeeklyData(user.id, 12),
    getTagDistribution(10),
    getTopContributors(10),
    getTopByValueScore(10),
    getUserValueScore(user.id),
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
          <Link
            href={`/api/exports/entries.csv?month=${new Date().toISOString().slice(0, 7)}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            当月CSVエクスポート
          </Link>
        </div>

        {/* Value Score Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">総記録時間</h3>
            <p className="text-3xl font-bold text-blue-600">{userScore.totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">平均評価</h3>
            <p className="text-3xl font-bold text-yellow-600">{userScore.avgRating.toFixed(1)} / 5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">評価件数</h3>
            <p className="text-3xl font-bold text-green-600">{userScore.feedbackCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">価値スコア</h3>
            <p className="text-3xl font-bold text-purple-600">{userScore.valueScore.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">時間×1.0 + 評価×2.0</p>
          </div>
        </div>

        {/* Charts Grid */}
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

        {/* Monthly Rankings Tables */}
        <div className="grid md:grid-cols-2 gap-8">
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
