import Link from 'next/link';
import { z } from 'zod';

const envSchema = z.object({
  ASANA_PAT: z.string().min(1),
  ASANA_WORKSPACE_GID: z.string().min(1),
  ASANA_PROJECT_GID: z.string().min(1),
});

export default function Integrations() {
  const enableAsana = process.env.NEXT_PUBLIC_ENABLE_ASANA === 'true';

  const envVars = {
    ASANA_PAT: process.env.ASANA_PAT,
    ASANA_WORKSPACE_GID: process.env.ASANA_WORKSPACE_GID,
    ASANA_PROJECT_GID: process.env.ASANA_PROJECT_GID,
  };

  const validation = envSchema.safeParse(envVars);
  const missingVars: string[] = [];

  if (!validation.success) {
    validation.error.issues.forEach((issue) => {
      missingVars.push(issue.path[0] as string);
    });
  }

  const isConfigured = validation.success;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">設定確認</h1>

          <div className="space-y-6">
            {/* 機能フラグ警告 */}
            {!enableAsana && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-700 font-medium">Asana機能が無効です</span>
                </div>
                <p className="text-yellow-600 text-sm">
                  .env.local に <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_ENABLE_ASANA=true</code> を設定して再起動してください
                </p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Asana連携設定</h2>
              
              {isConfigured ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium">Asana設定OK</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    すべての環境変数が設定されています
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium">設定が不完全です</span>
                  </div>
                  <p className="text-red-600 text-sm mb-3">
                    以下の環境変数が設定されていません:
                  </p>
                  <ul className="text-red-600 text-sm space-y-1">
                    {missingVars.map((varName) => (
                      <li key={varName} className="ml-4">• {varName}</li>
                    ))}
                  </ul>
                  <p className="text-red-600 text-sm mt-3">
                    .env.local に値を設定して再起動してください
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">設定方法</h3>
              <p className="text-blue-800 text-sm mb-2">
                プロジェクトルートに .env.local ファイルを作成し、以下の変数を設定してください:
              </p>
              <pre className="bg-blue-100 p-3 rounded text-sm text-blue-900 overflow-x-auto">
{`ASANA_PAT=your_personal_access_token
ASANA_WORKSPACE_GID=your_workspace_gid
ASANA_PROJECT_GID=your_project_gid`}
              </pre>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">現在の設定状況:</h3>
              <div className="space-y-2">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{key}</span>
                    <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {value ? '設定済み' : '未設定'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}