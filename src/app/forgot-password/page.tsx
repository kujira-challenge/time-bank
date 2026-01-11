'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // 入力検証
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '有効なメールアドレスを入力してください' });
      setIsSubmitting(false);
      return;
    }

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/auth/callback?next=/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setMessage({
          type: 'error',
          text: 'パスワードリセットメールの送信に失敗しました。メールアドレスを確認してください。',
        });
      } else {
        setEmailSent(true);
        setMessage({
          type: 'success',
          text: 'パスワードリセットメールを送信しました。メールをご確認ください。',
        });
      }
    } catch (error) {
      console.error('[Forgot Password] Unexpected error:', error);
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          パスワードリセット
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          登録されているメールアドレスを入力してください
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

          {emailSent && (
            <div className="mb-6 p-4 rounded-md bg-indigo-50 border border-indigo-200">
              <p className="text-sm text-indigo-800 mb-3">
                <strong>メールを確認してください</strong>
              </p>
              <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                <li>受信トレイに届いたリンクをクリックしてください</li>
                <li>リンクの有効期限は1時間です</li>
                <li>メールが届かない場合は、迷惑メールフォルダをご確認ください</li>
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
                disabled={isSubmitting || emailSent}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !email || emailSent}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isSubmitting || !email || emailSent
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? '送信中...' : emailSent ? 'メール送信済み' : 'リセットメールを送信'}
              </button>
            </div>
          </form>

          {emailSent && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setMessage(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                別のメールアドレスで再送する
              </button>
            </div>
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
