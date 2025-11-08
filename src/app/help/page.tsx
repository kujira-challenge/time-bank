import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Bank 使い方ガイド</h1>

          {/* 概要 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Time Bankとは？</h2>
            <p className="text-gray-700 mb-4">
              Time Bankは、チームメンバーの時間貢献を記録・管理するためのアプリケーションです。
              個人やチームの作業時間を「時間銀行」として記録し、可視化・分析することができます。
            </p>
          </section>

          {/* 基本的な使い方 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">基本的な使い方</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  1. ログイン
                </h3>
                <p className="text-gray-700">
                  招待されたメールアドレスとパスワードでログインしてください。
                  このシステムは招待制のため、アカウントが事前に作成されている必要があります。
                </p>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  2. エントリを作成
                </h3>
                <p className="text-gray-700 mb-2">
                  「エントリ作成」から作業時間を記録します：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li><strong>週開始日</strong>: 記録したい週の月曜日を選択（自動で月曜日に調整されます）</li>
                  <li><strong>時間数</strong>: 作業した時間を入力（0.5時間単位で入力可能）</li>
                  <li><strong>タグ</strong>: 作業内容を分類するためのタグを追加（例: 開発, デザイン, ミーティング）</li>
                  <li><strong>メモ</strong>: 作業内容の詳細や特記事項を記入</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  3. ダッシュボードで確認
                </h3>
                <p className="text-gray-700 mb-2">
                  「ダッシュボード」では以下の情報を確認できます：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>総記録時間、平均評価、評価件数、価値スコア</li>
                  <li>週次推移グラフ（過去12週間の時間推移）</li>
                  <li>タグ別の時間分布</li>
                  <li>チーム全体のランキング（時間数/価値スコア）</li>
                  <li>CSVエクスポート機能（月次データのダウンロード）</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-pink-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  4. エントリ一覧で管理
                </h3>
                <p className="text-gray-700 mb-2">
                  「エントリ一覧」では記録した時間の確認・管理ができます：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>週開始日、タグ、貢献者でフィルタリング</li>
                  <li>「自分のエントリのみ表示」で自分の記録に絞り込み</li>
                  <li>自分のエントリは削除可能</li>
                </ul>
              </div>
            </div>
          </section>

          {/* その他の機能 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">その他の機能</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">タスク依頼</h3>
                <p className="text-gray-700">
                  チームメンバーにタスクを依頼・管理できます。タスクの進捗状況やフィードバックを確認しましょう。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ユーザー管理</h3>
                <p className="text-gray-700">
                  新しいメンバーの招待やユーザー情報の管理を行います（管理者権限が必要な場合があります）。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">マイページ</h3>
                <p className="text-gray-700">
                  自分のプロフィール情報を確認・編集できます。
                </p>
              </div>
            </div>
          </section>

          {/* ヒント */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">使い方のヒント</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">定期的に記録しましょう</h3>
                <p className="text-yellow-800 text-sm">
                  週に一度、または作業が完了したタイミングで時間を記録すると、正確な時間管理ができます。
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">タグを活用しましょう</h3>
                <p className="text-yellow-800 text-sm">
                  作業内容に応じたタグを付けることで、後から分析しやすくなります。
                  チームで共通のタグを使うとより効果的です。
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">メモを残しましょう</h3>
                <p className="text-yellow-800 text-sm">
                  具体的な作業内容をメモに残すことで、振り返りや報告に役立ちます。
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">ダッシュボードを確認しましょう</h3>
                <p className="text-yellow-800 text-sm">
                  定期的にダッシュボードを確認することで、チームの活動状況や自分の貢献度を把握できます。
                </p>
              </div>
            </div>
          </section>

          {/* よくある質問 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">よくある質問</h2>

            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Q: エントリを間違えて作成してしまいました</h3>
                <p className="text-gray-700">
                  A: 「エントリ一覧」から該当のエントリを見つけて、削除ボタンで削除できます。
                  自分が作成したエントリのみ削除可能です。
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Q: 週開始日が自動で変わってしまいます</h3>
                <p className="text-gray-700">
                  A: 時間銀行では週を月曜日始まりで管理しています。
                  どの日付を選択しても、自動的に最も近い月曜日に調整されます。
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Q: 価値スコアとは何ですか？</h3>
                <p className="text-gray-700">
                  A: 価値スコアは、記録時間とフィードバック評価を組み合わせた指標です。
                  「時間 × 1.0 + 評価 × 2.0」で計算されます。
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q: CSVエクスポートは何に使えますか？</h3>
                <p className="text-gray-700">
                  A: ダッシュボードの「当月CSVエクスポート」ボタンから、月次データをCSV形式でダウンロードできます。
                  Excelなどで開いて詳細な分析や報告書作成に活用できます。
                </p>
              </div>
            </div>
          </section>

          {/* フッター */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              その他のご質問や不明点がありましたら、管理者にお問い合わせください。
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
