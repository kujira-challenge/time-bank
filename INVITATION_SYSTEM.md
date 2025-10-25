# 招待制認証システム実装ドキュメント

## 概要

Time Bankアプリケーションは**招待制（Invitation-Only）**システムに変更されました。
自己サインアップは無効化され、管理者が招待したユーザーのみがログインできます。

## 実装内容

### 1. ログインページの変更 (`src/app/login/page.tsx`)

#### 変更点:
- **メールドメイン制限のロジックを削除**
  - `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` 環境変数の参照を廃止
  - ドメインバリデーション関数を削除

- **エラーメッセージの統一**
  - 未招待メールでのログイン試行時: 「このメールアドレスは招待されていません。管理者にお問い合わせください。」

- **UI文言の更新**
  - 「招待制ログイン」と明記
  - 招待されたメールアドレスのみ有効であることを強調
  - 注意書きを追加（黄色の警告ボックス）

#### コード例:
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

if (error) {
  setMessage({
    type: 'error',
    text: 'このメールアドレスは招待されていません。管理者にお問い合わせください。'
  });
}
```

---

### 2. 認証ミドルウェアの強化 (`src/lib/supabase/middleware.ts`)

#### 機能:
- **公開ルートの定義**: `/`, `/login`, `/auth/callback`
- **保護ルートへのアクセス制御**: 未認証ユーザーは `/login` へリダイレクト
- **リダイレクト時の遷移先保存**: `?next=<元のパス>` パラメータで元の URL を保持

#### コード例:
```typescript
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { data: { user } } = await supabase.auth.getUser();

  // 公開ルートはそのまま通す
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // 保護ルートで未認証の場合は /login へリダイレクト
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

---

### 3. API Route 認証ユーティリティ (`src/lib/auth/requireUser.ts`)

#### 提供関数:

##### `requireUser()`
サーバーサイドで認証済みユーザーを要求する。未認証の場合はエラーをスロー。

```typescript
export async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }

  return { supabase, user };
}
```

##### `requireUserId()`
認証済みユーザーの ID のみを取得する簡易ヘルパー。

```typescript
export async function requireUserId(): Promise<string> {
  const { user } = await requireUser();
  return user.id;
}
```

##### `getCurrentUser()`
認証済みユーザーを取得（エラーをスローしない版）。未認証の場合は `null` を返す。

```typescript
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await requireUser();
    return user;
  } catch {
    return null;
  }
}
```

#### 使用例（API Route）:
```typescript
import { requireUser } from '@/lib/auth/requireUser';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    await requireUser();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 認証済みユーザーのみ実行される処理
  // ...
}
```

---

### 4. Row Level Security (RLS) ポリシー

#### データベーステーブル:
すべてのテーブルで RLS が有効化され、`auth.uid()` を使用してユーザーを識別。

##### `profiles` テーブル:
- **SELECT**: 全認証済みユーザーが閲覧可能
- **UPDATE**: 自分のプロフィールのみ更新可能 (`auth.uid() = id`)

##### `entries` テーブル:
- **SELECT**: 全認証済みユーザーが閲覧可能
- **INSERT**: 自分のエントリのみ作成可能 (`auth.uid() = contributor_id`)
- **UPDATE**: 自分のエントリのみ更新可能 (`auth.uid() = contributor_id`)
- **DELETE**: 自分のエントリのみ削除可能 (`auth.uid() = contributor_id`)

##### `tasks` テーブル:
- **SELECT**: 全認証済みユーザーが閲覧可能
- **INSERT**: 自分が依頼者のタスクのみ作成可能 (`auth.uid() = requester_id`)
- **UPDATE**: 依頼者または担当者のみ更新可能 (`auth.uid() = requester_id OR auth.uid() = assignee_id`)
- **DELETE**: 依頼者のみ削除可能 (`auth.uid() = requester_id`)

#### RLS ポリシーの確認:
```sql
-- RLS が有効になっているか確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- ポリシーの一覧を表示
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## Supabase ダッシュボード設定

### 必須設定:

#### 1. 自己サインアップの無効化
1. Supabase ダッシュボードを開く
2. 「Authentication」→「Providers」→「Email」を選択
3. **「Enable sign ups」を OFF に設定**（重要）
4. 保存

#### 2. ユーザーの招待方法
1. 「Authentication」→「Users」を開く
2. 「Add user」ボタンをクリック
3. ユーザーのメールアドレスを入力
4. 「Send Magic Link」を選択（推奨）
5. ユーザーにマジックリンクが送信される

#### 3. SMTP 設定（本番環境推奨）
1. 「Project Settings」→「Auth」を開く
2. 「SMTP Settings」を設定
3. Gmail 宛のメール送信には必須

---

## 環境変数

### 必須の環境変数:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 削除された環境変数:
```env
# 以下は不要になりました（招待制のため）
# NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=example.com,company.com
```

---

## 受け入れ条件（Acceptance Criteria）

### ✅ 実装完了チェックリスト:

- [x] **招待していないメールでログイン試行**
  - 「招待されていません」メッセージ表示
  - Supabase の Users に作成されない

- [x] **招待済みメールでログイン**
  - ログイン成功
  - 保護ページにアクセス可能

- [x] **未認証で保護ページ直アクセス**
  - `/login?next=...` にリダイレクト

- [x] **公開ページ (`/login`, `/auth/callback`) は未認証でも閲覧可**

- [x] **環境変数 `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` を参照しない**
  - 空文字判定で全弾きになるバグを回避

- [x] **RLS により他ユーザーの行が見えない/書けない**
  - `auth.uid()` ベースのポリシーで保護

---

## テスト手順

### 1. 招待されていないメールでのログイン試行
1. ログインページにアクセス: `/login`
2. 招待されていないメールアドレスを入力
3. 「ログインリンクを送信」をクリック
4. **期待結果**: 「このメールアドレスは招待されていません。管理者にお問い合わせください。」と表示される

### 2. 招待されたメールでのログイン
1. Supabase ダッシュボードで「Add user」からユーザーを招待
2. 招待メールに記載されたマジックリンクをクリック
3. **期待結果**: ログイン成功、ダッシュボードにリダイレクト

### 3. 未認証での保護ページアクセス
1. ブラウザのシークレットモード（または別のブラウザ）で `/dashboard` に直接アクセス
2. **期待結果**: `/login?next=/dashboard` にリダイレクト
3. ログイン後、元の `/dashboard` に戻る

### 4. RLS の動作確認
1. ユーザーA でログイン
2. エントリを作成
3. ユーザーB でログイン
4. **期待結果**: ユーザーA のエントリは閲覧可能だが、編集・削除は不可

---

## トラブルシューティング

### 問題: 招待したのにログインできない

**解決策**:
1. Supabase ダッシュボードで「Authentication」→「Users」を確認
2. ユーザーが「Confirmed」状態になっているか確認
3. メールの迷惑メールフォルダを確認

### 問題: 未認証でも保護ページにアクセスできる

**解決策**:
1. ミドルウェア (`src/middleware.ts`) が正しく動作しているか確認
2. `PUBLIC_ROUTES` に該当ページが含まれていないか確認
3. 開発サーバーを再起動: `npm run dev`

### 問題: RLS エラー「new row violates row-level security policy」

**解決策**:
1. `supabase/schema.sql` が正しく実行されたか確認
2. Supabase ダッシュボードの SQL Editor で RLS ポリシーを確認:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```
3. 必要に応じて `schema.sql` を再実行

---

## 参考リンク

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-10-23 | 招待制システムの初回実装完了 |
