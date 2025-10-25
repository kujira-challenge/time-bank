'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TEMPLATES, PROJECT_NAME_REGEX } from '@/config/templates';

export default function TemplatesSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const filteredTemplates = TEMPLATES.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.label.toLowerCase().includes(query) ||
      template.kind.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const isNameValid = PROJECT_NAME_REGEX.test(projectName);

  const handleDuplicate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template.key);
    window.open(template.url, '_blank');
  };

  const handleConfirmNaming = () => {
    if (!isNameValid) {
      alert('命名規約に沿った名前を入力してください');
      return;
    }

    alert(
      `命名規約チェックOK!\n\n` +
      `プロジェクト名: ${projectName}\n\n` +
      `次のステップ:\n` +
      `1. Figmaでテンプレートをコピーしてください\n` +
      `2. コピー後のURLを控えておいてください\n\n` +
      `※ 現在はローカル保存のみです。将来的にデータベース保存機能を追加予定です。`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">テンプレート選択</h1>
          <p className="text-gray-600 mt-2">
            Figma/FigJamテンプレートを選んでプロジェクトを開始
          </p>
        </div>

        {/* 検索フィルタ */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            テンプレート検索
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前やキーワードで検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            ラベル、種類（figma/figjam）、説明から検索できます
          </p>
        </div>

        {/* テンプレート一覧 */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">利用可能なテンプレート</h2>

          {filteredTemplates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              検索条件に一致するテンプレートがありません
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.key}
                  className={`border-2 rounded-lg p-6 transition-all ${
                    selectedTemplate === template.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.label}</h3>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                        template.kind === 'figma'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {template.kind.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  )}

                  <button
                    onClick={() => handleDuplicate(template)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Duplicate / コピー
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 命名規約チェック */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">プロジェクト名の命名規約チェック</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: PJ1-Kickoff-20251013"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* バリデーション結果 */}
            {projectName && (
              <div className="flex items-center space-x-2">
                {isNameValid ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">OK: 命名規約に適合しています</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">NG: 正しい形式で入力してください</span>
                  </div>
                )}
              </div>
            )}

            {/* 規約説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">命名規約</h3>
              <p className="text-sm text-blue-800 mb-2">
                形式: <code className="bg-blue-100 px-2 py-1 rounded">[A-Z0-9_-]&#123;3,&#125;-[A-Za-z]+-\d&#123;8&#125;</code>
              </p>
              <p className="text-sm text-blue-800">
                例: <code className="bg-blue-100 px-2 py-1 rounded">PJ1-Kickoff-20251013</code>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>プロジェクトID（大文字・数字・アンダースコア・ハイフン、3文字以上）</li>
                <li>テンプレート名（英字）</li>
                <li>日付（YYYYMMDD形式）</li>
              </ul>
            </div>

            {/* 確認ボタン */}
            <div className="pt-4">
              <button
                onClick={handleConfirmNaming}
                disabled={!isNameValid}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isNameValid
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                命名規約を確認
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                URLを控えておいてください（今後のDB保存機能で使用します）
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
