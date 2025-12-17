import type { RecentActivity } from '@/lib/dashboard/aggregations';

type RecentActivitiesCardProps = {
  activities: RecentActivity[];
};

/**
 * 最近の活動（最新5件）
 * - エントリの一覧を表示
 */
export default function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">最近の活動</h2>
        <div className="flex items-center justify-center h-32 text-gray-500">
          アクティビティがありません
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">最近の活動（最新5件）</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{activity.contributor_name}</span>
                  {activity.recipient_name && (
                    <>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{activity.recipient_name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{activity.hours}h</span>
                  <span>週始：{formatDate(activity.week_start)}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {formatDateTime(activity.created_at)}
              </span>
            </div>

            {activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {activity.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {activity.note && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
