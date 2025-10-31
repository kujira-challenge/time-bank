# 🕒 Time Bank  
**Next.js 15 + TypeScript + Supabase** で構築された、  
チームの時間貢献を可視化・共有するための「timebank」アプリです。

---

## 🌐 デモURL
**Production（Vercel）:**  
🔗 https://time-bank-kujirachallenges-projects.vercel.app  

---

## 👤 デモアカウント
個別連携

> 現在、Supabase Authentication によって登録済みユーザーのみがログインできます。
> サインアップは管理者が Supabase Console から招待します。

---

## 📋 要件・概要

| 区分 | 内容 |
|------|------|
| アプリ名 | Time Bank |
| 目的 | チーム・個人の「時間貢献記録」と「見える化」 |
| 認証 | Supabase Auth（メールリンク方式） |
| データベース | Supabase PostgreSQL |
| デプロイ | Vercel（mainブランチ連携） |
| ストレージ | Supabase（将来的にCSVや添付の保存も予定） |

---

## 🧩 機能一覧

### 時間銀行（メイン機能）
- 🕓 **エントリ作成** `/entries/create`  
  自分の貢献時間を週単位で登録（タグ・メモ付き）
- 📅 **エントリ一覧** `/entries`  
  登録済みの時間記録を一覧・フィルタ表示
- 📊 **ダッシュボード** `/dashboard`  
  週別・タグ別・累計時間の集計表示（SPICE風グラフ）

### その他機能
- 👥 **ユーザー管理** `/settings/users`
  Supabaseのprofilesテーブルを参照（Read-only表示）
- 🧭 **マイページ** `/mypage`
  自分の登録履歴を閲覧
- 🔒 **ログイン／ログアウト** `/login`, `/auth/callback`

---

## ⚙️ 使用技術

| 分類 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UI | Tailwind CSS + ShadCN UI |
| バリデーション | Zod |
| 認証・DB | Supabase (Auth / RLS / Storage) |
| ホスティング | Vercel |
| データ通信 | Supabase JS SDK (`@supabase/ssr`) |

---

## 🌐 外部API
- Supabase REST + Auth API  
  認証・プロファイル・RLS制御で使用  
- （Asanaなど他サービスは今後連携予定）

---

## 🧱 環境構築手順

### 1️⃣ 依存関係のインストール

```bash
npm ci
```

### 2️⃣ `.env.local` を作成し以下を設定

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=（サーバー用・必要に応じて）
```

> Supabase Dashboard → Settings → API でコピーできます。

---

### 3️⃣ ローカル開発起動

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000) にアクセス

---

### 4️⃣ 本番デプロイ（Vercel）

1. GitHub リポジトリを Vercel に接続  
   `https://github.com/kujira-challenge/time-bank`
2. Vercel → Settings → Environment Variables に  
   上記 `.env.local` の3項目を追加  
3. **Redeploy (clear build cache ON)**  
4. 成功後、 `/login` にアクセスして認証確認

---

## 🧰 セットアップ構成

```
src/
├── app/
│   ├── entries/           # 時間エントリ作成・一覧
│   ├── dashboard/         # ダッシュボード集計
│   ├── settings/users/    # ユーザー一覧（profiles）
│   ├── login/             # ログイン画面
│   ├── auth/callback/     # Supabase Auth Callback
│   └── mypage/            # 自分の記録
├── components/            # UIコンポーネント群
├── lib/supabase/          # Supabase接続設定
├── config/                # 設定ファイル
└── types/                 # 型定義
```

---

## 🧮 アーキテクチャ概要

- **Frontend:** Next.js App Router（SSR + Client Components）
- **Auth:** Supabase Auth + Middleware Guard  
  `/login`, `/auth/callback` 以外は保護
- **DB構成:**  
  - `profiles`: ユーザー情報（role: member/admin）  
  - `entries`: 時間記録  
  - `tasks`: タスク依頼  
  - `task_feedbacks`: レビュー（将来拡張）

---

## 💬 機能別スクリーンショット（概要）

| 画面 | 説明 |
|------|------|
| 🏠 `/` | ホーム（ログイン状態確認） |
| ⏱ `/entries/create` | 時間登録フォーム |
| 📋 `/entries` | エントリ一覧＋フィルタ |
| 📊 `/dashboard` | 週次／タグ別グラフ |
| 👥 `/settings/users` | ユーザー一覧（Read-only） |

> 実際のスクリーンショットGIFは `/docs/images/` に配置予定です。

---

## 🧪 動作確認手順

1. `/login` にアクセス → Supabaseメール認証でログイン  
2. `/entries/create` で新規エントリを登録  
3. `/entries` で自分の登録が表示される  
4. `/dashboard` で時間集計が見える  
5. `/settings/users` で他メンバーの一覧を確認  

---

## 🔐 セキュリティ設計

- Supabase Row-Level Security (RLS) により、  
  ユーザー自身のレコードのみ参照・更新可能。
- Service Role Key は **サーバー側のみ使用**。
- Supabase Auth + Next.js Middleware によるアクセス制御。
- APIキーは `.env.local` / Vercel 環境変数で安全に管理。

---

## 🚀 今後の拡張予定

- [ ] 管理者の権限拡張（ユーザー招待・ロール管理・監査ログ）
- [ ] Asanaなど外部アプリ連携（双方向タスク同期）
- [ ] 月次スコアレポート（`monthly_value_scores`）
- [ ] Slack通知 / Webhook連携
- [ ] ファイルアップロード機能（Supabase Storage）

---

## 🧭 トラブルシューティング

| 症状 | 対処 |
|------|------|
| `/login` でビルドエラー（Vercel） | NEXT_PUBLIC_SUPABASE_URL / KEY 未設定 |
| ログイン後に画面が空白 | Supabase Auth Callback URL が未登録 |
| データが表示されない | RLSまたはAuth設定の不整合を確認 |
| 登録できない | 自分の `auth.uid()` と `profiles.id` の一致を確認 |

---

## 🗺️ ライセンス
MIT License
