# Time Bank セットアップガイド

このガイドでは、Time Bankアプリケーションのセットアップ手順を説明します。

## 前提条件

- Node.js 18.x 以上
- npm または yarn
- Supabaseアカウント（無料プランで可）

## 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン（既に完了している場合はスキップ）
cd time-bank

# 依存関係をインストール
npm install
```

## 2. Supabaseプロジェクトの作成

### 2.1 Supabaseアカウントの作成

1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」をクリックしてアカウントを作成
3. 新しいプロジェクトを作成

### 2.2 プロジェクト情報の取得

1. Supabaseダッシュボードで作成したプロジェクトを開く
2. 左サイドバーの「Project Settings」→「API」を開く
3. 以下の情報をメモ:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 3. データベースのセットアップ

### 3.1 スキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. プロジェクトルートの `supabase/schema.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

これにより以下のテーブルが作成されます:
- `profiles`: ユーザープロフィール
- `entries`: 時間銀行の貢献記録
- `tasks`: タスク依頼

### 3.2 認証設定（招待制）

**重要**: このシステムは招待制です。自己サインアップを無効化してください。

#### Redirect URLs の設定
1. Supabaseダッシュボードで「Authentication」→「URL Configuration」を開く
2. **Redirect URLs** に以下を追加:
   - 本番環境: `https://あなたの本番URL/auth/callback`
   - 開発環境: `http://localhost:3000/auth/callback`

**重要:** `/reset-password` を直接追加してはいけません。必ず `/auth/callback` を追加してください。

#### Email Provider の設定
1. Supabaseダッシュボードで「Authentication」→「Providers」を開く
2. 「Email」を有効化
3. **「Enable Email provider」を ON に設定**
4. **「Confirm email」を OFF に設定**（招待制のため不要）
5. **「Allow new users to sign up」を OFF に設定**（重要）
6. 「Email Templates」で以下を設定:
   - Reset Password（パスワードリセット用）

### 3.3 メール認証の設定

開発環境では、Supabaseが提供する無料のメールサービスを使用できます。
本番環境では、独自のSMTPサーバーを設定することを推奨します。

1. 「Project Settings」→「Auth」を開く
2. 「SMTP Settings」を設定（本番環境のみ）

## 4. 環境変数の設定

### 4.1 環境変数ファイルの作成

```bash
cp .env.local.example .env.local
```

### 4.2 必須の環境変数を設定

`.env.local` ファイルを開き、以下を設定:

```env
# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 機能フラグ（オプション）
NEXT_PUBLIC_ENABLE_TEMPLATES=false
NEXT_PUBLIC_ENABLE_ASANA=false
```

**注意**: 招待制システムのため、メールドメイン制限の環境変数（NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS）は不要になりました。

## 5. アプリケーションの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス

## 6. ユーザー招待とログイン（招待制 + パスワード）

### 6.1 ユーザーの招待（管理者）

1. Supabaseダッシュボードで「Authentication」→「Users」を開く
2. 「Add user」ボタンをクリック
3. ユーザーのメールアドレスを入力
4. **パスワードを設定するか、「Auto generate password」を選択**
5. 「Create user」をクリック
6. ユーザーが作成されたら、ユーザーに初回ログイン手順を連絡

### 6.2 招待されたユーザーの初回ログイン

**正しいフロー:**
1. `/forgot-password` ページにアクセス
2. **招待されたメールアドレス**を入力
3. 「リセットメールを送信」をクリック
4. メールボックスに届いたパスワードリセットメールを開く
5. メールのリンクをクリック
   - リンク先: `/auth/callback?next=/reset-password`
   - `/auth/callback` で自動的にセッションが確立される
   - `/reset-password` に自動リダイレクト
6. `/reset-password` ページで新しいパスワード（6文字以上）を設定
7. `/login` ページに自動リダイレクト
8. メールアドレスとパスワードでログイン
9. プロフィールが作成され、ログイン完了

**重要:**
- パスワードリセットは **必ず `/auth/callback` を経由** します
- これにより Supabase のセッションが正しく確立されます
- 招待されていないメールアドレスではログインできません
- パスワードリセットリンクの有効期限は1時間です
- パスワードは6文字以上で設定してください

### 6.3 再ログイン（2回目以降）

1. `/login` ページにアクセス
2. メールアドレスとパスワードを入力
3. 「ログイン」をクリック

### 6.4 パスワードを忘れた場合

**ユーザー側の対処:**
1. `/forgot-password` ページにアクセス
2. メールアドレスを入力
3. パスワードリセットメールが送信される
4. メールのリンクから新しいパスワードを設定

**管理者側の対処:**
1. ユーザーに `/forgot-password` ページにアクセスしてもらうよう案内
2. メールが届かない場合は、迷惑メールフォルダを確認してもらう

## 7. 動作確認

### 7.1 時間銀行機能のテスト

1. `/entries/create` で貢献記録を作成
2. `/entries` で一覧を確認
3. `/dashboard` で集計データを確認

### 7.2 タスク依頼機能のテスト

1. `/tasks/create` でタスク依頼を作成
2. `/tasks` でタスク一覧を確認

### 7.3 マイページの確認

1. `/mypage` で自分のプロフィール情報を確認

## トラブルシューティング

### データベース接続エラー

**エラー**: `Failed to fetch` や `Connection refused`

**解決策**:
1. `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
2. Supabaseプロジェクトが正しく起動しているか確認
3. 開発サーバーを再起動: `npm run dev`

### 認証エラー

**エラー**: `Auth session missing!`

**解決策**:
1. Supabaseダッシュボードで「Authentication」が有効になっているか確認
2. メールプロバイダーが正しく設定されているか確認
3. ブラウザのCookieが有効になっているか確認

### RLSエラー

**エラー**: `new row violates row-level security policy`

**解決策**:
1. `supabase/schema.sql` が正しく実行されたか確認
2. SupabaseダッシュボードのSQL Editorで以下を実行して確認:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

### パスワードリセットメールが届かない

**解決策**:
1. 迷惑メールフォルダを確認
2. Supabase ダッシュボードで「Authentication」→「Users」を確認（ユーザーが存在するか）
3. SMTP 設定が正しいか確認（本番環境の場合）
4. 開発環境: Supabase のメール送信制限を確認

## オプション機能の設定

### Asana連携（オプション）

Asana連携を有効にする場合:

1. `.env.local` に以下を追加:
   ```env
   NEXT_PUBLIC_ENABLE_ASANA=true
   ASANA_PAT=your_personal_access_token
   ASANA_WORKSPACE_GID=your_workspace_gid
   ASANA_PROJECT_GID=your_project_gid
   ```

2. 詳細は `README.md` の「Asana設定の確認方法」を参照

### テンプレート機能（オプション）

Figma/FigJamテンプレート機能を有効にする場合:

```env
NEXT_PUBLIC_ENABLE_TEMPLATES=true
```

## 本番環境へのデプロイ

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. プロジェクトをインポート
3. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - その他必要な環境変数

### 本番環境での注意事項

1. **招待制の確認**: Supabaseダッシュボードで「Self signups」が OFF になっていることを必ず確認
2. **SMTP設定**: Supabaseの無料メールではなく、独自のSMTPサーバーを使用（特にGmail宛の場合）
3. **RLS**: 本番環境ではRow Level Securityが正しく動作しているか確認
4. **環境変数**: 機密情報は環境変数で管理し、リポジトリにコミットしない
5. **ユーザー管理**: 招待されたユーザーのみがアクセスできることを確認

## サポート

問題が解決しない場合:
1. `README.md` のトラブルシューティングセクションを確認
2. GitHubのIssuesで報告
3. Supabaseの[ドキュメント](https://supabase.com/docs)を参照
