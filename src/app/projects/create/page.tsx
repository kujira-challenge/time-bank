/**
 * @deprecated このページは非推奨です。
 * 新しいテンプレート選択機能は /settings/templates に移動しました。
 * 将来のバージョンで削除予定です。
 *
 * 移行理由:
 * - テンプレート選択は設定画面に集約
 * - 機能フラグによる表示制御をサポート
 * - より柔軟なテンプレート管理を実現
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

const figmaTemplates = [
  {
    key: 'kickoff',
    label: 'Kickoff テンプレート',
    url: 'https://www.figma.com/community/file/XXXXX/kickoff-template' // 差し替えてください
  },
  {
    key: 'ujm',
    label: 'UJM テンプレート',
    url: 'https://www.figma.com/community/file/XXXXX/ujm-template' // 差し替えてください
  },
  {
    key: 'ia',
    label: 'IA テンプレート',
    url: 'https://www.figma.com/community/file/XXXXX/ia-template' // 差し替えてください
  },
  {
    key: 'figjam',
    label: 'FigJam テンプレート',
    url: 'https://www.figma.com/community/file/XXXXX/figjam-template' // 差し替えてください
  }
];

const nameRegex = /^[A-Z0-9_-]{3,}-[A-Za-z]+-\d{8}$/;

export default function ProjectsCreate() {
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const isNameValid = nameRegex.test(projectName);

  const handleRegisterUrl = () => {
    alert('今後の実装: コピー後のURLをデータベースに保存する機能を追加予定です。現在は設定確認のみ可能です。');
  };

  const handleTemplateClick = (template: typeof figmaTemplates[0]) => {
    setSelectedTemplate(template.key);
    window.open(template.url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プロジェクト作成</h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Figmaテンプレートを選択</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {figmaTemplates.map((template) => (
                <button
                  key={template.key}
                  onClick={() => handleTemplateClick(template)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedTemplate === template.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{template.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    テンプレを開いて&quot;Duplicate/コピー&quot;
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">プロジェクト名の命名規約チェック</h2>
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
                  placeholder="例: PJ1-Kickoff-20250821"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {projectName && (
                  <>
                    {isNameValid ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        OK: 命名規約に適合しています
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        NG: 正しい形式で入力してください（例: PJ1-Kickoff-20250821）
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                命名規約: [A-Z0-9_-]&#123;3,&#125;-[A-Za-z]+-\d&#123;8&#125; の形式で入力してください
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleRegisterUrl}
              disabled={!selectedTemplate || !isNameValid}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                selectedTemplate && isNameValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              コピー後のURLを登録
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Figmaでテンプレートをコピーした後、このボタンを押してください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}