'use client';

import { useState } from 'react';
import type { EvaluationAxis, EvaluationItem, EvaluationAxisKey } from '@/types';

type DetailedEvaluationSectionProps = {
  evaluationAxes: EvaluationAxis[];
  selectedEvaluations: EvaluationItem[];
  onChange: (evaluations: EvaluationItem[]) => void;
};

/**
 * 相手への詳細評価（任意）セクション
 * - 初期状態では折りたたみ
 * - 10評価軸を文章ラベルとして表示
 * - 1〜2個選択を推奨（強制なし）
 * - 選択した軸ごとにスコア（1-5）とコメント入力
 */
export default function DetailedEvaluationSection({
  evaluationAxes,
  selectedEvaluations,
  onChange,
}: DetailedEvaluationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleAxis = (axisKey: EvaluationAxisKey) => {
    const isSelected = selectedEvaluations.some((e) => e.axis_key === axisKey);

    if (isSelected) {
      // 選択解除
      onChange(selectedEvaluations.filter((e) => e.axis_key !== axisKey));
    } else {
      // 選択追加
      onChange([...selectedEvaluations, { axis_key: axisKey, score: 3, comment: '' }]);
    }
  };

  const handleScoreChange = (axisKey: EvaluationAxisKey, score: number) => {
    onChange(
      selectedEvaluations.map((e) =>
        e.axis_key === axisKey ? { ...e, score } : e
      )
    );
  };

  const handleCommentChange = (axisKey: EvaluationAxisKey, comment: string) => {
    onChange(
      selectedEvaluations.map((e) =>
        e.axis_key === axisKey ? { ...e, comment } : e
      )
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left"
      >
        <h3 className="text-md font-semibold text-gray-900">
          相手への詳細評価（任意）
        </h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            時間を提供してくれた相手への評価を記録します。<br />
            代表的に感じたことを1〜2個選んで評価してください。
          </p>

          {/* 評価項目チェックボックス */}
          <div className="space-y-2">
            {evaluationAxes.map((axis) => {
              const isSelected = selectedEvaluations.some((e) => e.axis_key === axis.axis_key);
              const evaluation = selectedEvaluations.find((e) => e.axis_key === axis.axis_key);

              return (
                <div key={axis.axis_key} className="space-y-3">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleAxis(axis.axis_key)}
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{axis.axis_label}</span>
                  </label>

                  {/* 選択された場合にスコアとコメント入力を表示 */}
                  {isSelected && evaluation && (
                    <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-3">
                      {/* スコア入力 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          スコア（1〜5）
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleScoreChange(axis.axis_key, score)}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                evaluation.score === score
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* コメント入力 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          コメント（任意）
                        </label>
                        <textarea
                          value={evaluation.comment}
                          onChange={(e) => handleCommentChange(axis.axis_key, e.target.value)}
                          placeholder="具体的なエピソードや感想があれば記入してください"
                          rows={2}
                          maxLength={500}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {evaluation.comment.length} / 500 文字
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedEvaluations.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                {selectedEvaluations.length}個の評価軸を選択中
                {selectedEvaluations.length > 2 && ' （1〜2個の選択を推奨）'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
