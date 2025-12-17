import type { QuarterlySummary } from '@/types';

type QuarterlySummaryCardProps = {
  summary: QuarterlySummary | null;
};

/**
 * 最新クォータリーリフレクション サマリーカード
 * - 対象期間
 * - 達成率
 * - 他者評価平均
 * - 目標平均
 * - 次のアクション（最大3件、期限付き）
 * - 「目標を設定」ボタン
 *
 * ※ クォータリーが存在しない場合は表示しない
 */
export default function QuarterlySummaryCard({ summary }: QuarterlySummaryCardProps) {
  if (!summary) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            最新クォータリーリフレクション
          </h2>
          <p className="text-sm text-gray-600">
            対象期間：{formatDate(summary.quarter_start)} - {formatDate(summary.quarter_end)}
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
          目標を設定
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 達成率 */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">達成率</p>
          <p className="text-2xl font-bold text-blue-600">
            {summary.achievement_rate.toFixed(1)}%
          </p>
        </div>

        {/* 他者評価平均 */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">他者評価平均</p>
          <p className="text-2xl font-bold text-yellow-600">
            {summary.avg_peer_rating > 0 ? summary.avg_peer_rating.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-gray-500">5段階</p>
        </div>

        {/* 目標平均 */}
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">目標平均</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.avg_goal_rating > 0 ? summary.avg_goal_rating.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-gray-500">5段階</p>
        </div>
      </div>

      {/* 次のアクション */}
      {summary.actions.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">次のアクション</h3>
          <ul className="space-y-2">
            {summary.actions.map((action) => (
              <li key={action.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{action.action_text}</span>
                {action.deadline && (
                  <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                    期限：{formatDate(action.deadline)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
