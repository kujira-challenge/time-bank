'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // セッションが有効か確認
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        setMessage({
          type: 'error',
          text: 'セッションが無効です。パスワードリセットメールのリンクから再度アクセスしてください。',
        });
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // 入力検証
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください' });
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'パスワードが一致しません' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage({
          type: 'error',
          text: 'パスワードの更新に失敗しました。もう一度お試しください。',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'パスワードを更新しました。ログインページに移動します...',
        });
        // 2秒後にログインページにリダイレクト
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('[Reset Password] Unexpected error:', error);
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          新しいパスワードを設定
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          新しいパスワードを入力してください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {!isValidSession && !message && (
            <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                セッションを確認しています...
              </p>
            </div>
          )}

          {isValidSession && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="新しいパスワード（6文字以上）"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード確認
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="パスワードを再入力"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    isSubmitting || !password || !confirmPassword
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? '更新中...' : 'パスワードを更新'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
              ← ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
