'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { EvaluationAxisScore } from '@/types';

type EvaluationTrendsCardProps = {
  trends: EvaluationAxisScore[];
};

type ChartTab = 'radar' | 'bar';

/**
 * 評価傾向（10評価軸）
 * - Tabsで切替：レーダーチャート / 棒グラフ
 * - 各評価項目をクリック可能（モーダル表示）
 */
export default function EvaluationTrendsCard({ trends }: EvaluationTrendsCardProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('radar');
  const [selectedAxis, setSelectedAxis] = useState<EvaluationAxisScore | null>(null);

  if (trends.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">評価傾向（10評価軸）</h2>
        <div className="flex items-center justify-center h-64 text-gray-500">
          評価データがありません
        </div>
      </div>
    );
  }

  // チャート用のデータ整形
  const chartData = trends.map((t) => ({
    axis_label: t.axis_label,
    score: parseFloat(t.avg_score.toFixed(2)),
  }));

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">評価傾向（10評価軸）</h2>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'radar'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            レーダーチャート
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'bar'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            棒グラフ
          </button>
        </div>

        {/* Chart */}
        {activeTab === 'radar' ? (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis_label" />
              <PolarRadiusAxis domain={[0, 5]} />
              <Radar
                name="評価スコア"
                dataKey="score"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} />
              <YAxis dataKey="axis_label" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8884d8" name="評価スコア" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 評価項目リスト（クリック可能） */}
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">評価項目詳細</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trends.map((trend) => (
              <button
                key={trend.axis_key}
                onClick={() => setSelectedAxis(trend)}
                className="p-3 border border-gray-200 rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trend.axis_label}</p>
                    <p className="text-xs text-gray-500 mt-1">評価件数：{trend.count}件</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {trend.avg_score > 0 ? trend.avg_score.toFixed(1) : '-'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* モーダル */}
      {selectedAxis && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedAxis(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedAxis.axis_label}</h3>
              <button
                onClick={() => setSelectedAxis(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">評価値</p>
                <p className="text-3xl font-bold text-blue-600">
                  {selectedAxis.avg_score > 0 ? selectedAxis.avg_score.toFixed(1) : '-'}
                </p>
                <p className="text-xs text-gray-500">1〜5段階</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">評価件数</p>
                <p className="text-2xl font-bold text-gray-700">{selectedAxis.count}件</p>
              </div>

              <div className="text-sm text-gray-600">
                <p>この評価軸は、{selectedAxis.count}件の評価から算出された平均値です。</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAxis(null)}
              className="mt-6 w-full py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
