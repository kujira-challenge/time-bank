import type { KPIStats } from '@/lib/dashboard/aggregations';

type DashboardStatsProps = {
  stats: KPIStats;
};

/**
 * KPIカード（5枚）
 * - 提供した時間
 * - 受け取った時間
 * - 時間収支（状態ラベル付き）
 * - 平均評価
 * - 協働メンバー数
 */
export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {/* 提供した時間 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-2">提供した時間</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.providedHours.toFixed(1)}h</p>
        <p className="text-xs text-gray-500 mt-1">合計時間</p>
      </div>

      {/* 受け取った時間 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-2">受け取った時間</h3>
        <p className="text-3xl font-bold text-green-600">{stats.receivedHours.toFixed(1)}h</p>
        <p className="text-xs text-gray-500 mt-1">合計時間</p>
      </div>

      {/* 時間収支 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-2">時間収支</h3>
        <p className={`text-3xl font-bold ${
          stats.balanceHours > 0 ? 'text-orange-600' :
          stats.balanceHours < 0 ? 'text-purple-600' :
          'text-gray-600'
        }`}>
          {stats.balanceHours > 0 ? '+' : ''}{stats.balanceHours.toFixed(1)}h
        </p>
        <p className="text-xs text-gray-500 mt-1">{stats.balanceLabel}</p>
      </div>

      {/* 平均評価 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-2">平均評価</h3>
        <p className="text-3xl font-bold text-yellow-600">
          {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
        </p>
        <p className="text-xs text-gray-500 mt-1">5段階</p>
      </div>

      {/* 協働メンバー数 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-2">協働メンバー数</h3>
        <p className="text-3xl font-bold text-indigo-600">{stats.collaboratorCount}</p>
        <p className="text-xs text-gray-500 mt-1">人数</p>
      </div>
    </div>
  );
}
