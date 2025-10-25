'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // メールアドレスの検証
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '有効なメールアドレスを入力してください' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // 招待されていないメールの場合のエラーメッセージ
        setMessage({
          type: 'error',
          text: 'このメールアドレスは招待されていません。管理者にお問い合わせください。'
        });
      } else {
        setMessage({
          type: 'success',
          text: 'ログインリンクをメールで送信しました。メールをご確認ください。',
        });
        setEmail('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">Time Bank</h1>
        <h2 className="text-center text-xl text-gray-600">ログイン</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>招待制ログイン</strong>
                <br />
                招待されたメールアドレスでログインしてください。
                <br />
                メールアドレスを入力すると、ログイン用のリンクが送信されます。
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>ご注意</strong>
                <br />
                このシステムは招待制です。未招待のメールアドレスではログインできません。
              </p>
            </div>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                招待されたメールアドレス
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
                disabled={isSubmitting}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isSubmitting || !email
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? '送信中...' : 'ログインリンクを送信'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              ← ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
