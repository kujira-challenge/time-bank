import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">Time Bank</h1>
        <h2 className="text-center text-xl text-gray-600">ログイン（Magic Link）</h2>
        <p className="text-center text-sm text-gray-500 mt-2">
          メールでログインリンクを受け取る
        </p>
      </div>

      <Suspense fallback={<div className="text-center mt-8">読み込み中...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
