# 招待制認証システム実装ドキュメント（パスワード方式）

## 概要

Time Bankアプリケーションは**招待制（Invitation-Only）+ パスワード認証**システムです。
自己サインアップは無効化され、管理者が招待したユーザーのみがログインできます。

**認証方式**: メール + パスワード
**パスワード**: 必須（初回はパスワードリセット機能で設定）

## 実装内容

### 重要: パスワードリセットフローの仕組み

パスワードリセットは **必ず `/auth/callback` を経由** します。これにより Supabase のセッションが正しく確立されます。

**正しいフロー:**
1. ユーザーが `/forgot-password` でメールアドレスを入力
2. パスワードリセットメールが送信される（リンク先: `/auth/callback?next=/reset-password`）
3. メールのリンクをクリック → `/auth/callback` に遷移
4. `/auth/callback` で `exchangeCodeForSession(code)` を実行してセッション確立
5. `/reset-password` に自動リダイレクト
6. ユーザーが新しいパスワードを設定
7. `/login` ページへリダイレクト

**なぜ `/auth/callback` を経由するのか:**
- `/reset-password` に直接リダイレクトすると、セッションが確立されない
- Supabase のパスワードリセットリンクには `code` パラメータが含まれる
- この `code` を `exchangeCodeForSession()` で交換することでセッションが確立される

### 1. ログインページの変更 (`src/app/login/LoginForm.tsx`)

#### 変更点:
- **パスワード認証方式に統一**
  - `signInWithPassword` を使用
  - メールアドレス + パスワード入力欄を実装
  - パスワード忘れリンクを追加（`/forgot-password`）

- **エラーメッセージの統一**
  - 未招待メールまたはパスワード不一致時: 「メールアドレスまたはパスワードが正しくありません。」
  - 詳細なエラータイプに応じたメッセージ表示

- **UI文言の更新**
  - 「招待制ログイン」と明記
  - ログイン成功時は `/dashboard` または `next` パラメータへリダイレクト

#### コード例:
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  if (error.message.includes('Invalid login credentials')) {
    setMessage({
      type: 'error',
      text: 'メールアドレスまたはパスワードが正しくありません。',
    });
  } else {
    setMessage({
      type: 'error',
      text: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
    });
  }
} else {
  router.push(redirectTo);
}
```

### 2. パスワードリセット機能 (`src/app/forgot-password/page.tsx`)

#### 重要な実装ポイント:
- `redirectTo` は **必ず `/auth/callback?next=/reset-password`** に設定
- 直接 `/reset-password` にリダイレクトしてはいけない

#### コード例:
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
const redirectUrl = `${siteUrl}/auth/callback?next=/reset-password`;

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

**よくある間違い（NG）:**
```typescript
// ❌ これだとセッションが確立されない
const redirectUrl = `${siteUrl}/reset-password`;
```

### 3. パスワード設定ページ (`src/app/reset-password/page.tsx`)

#### 実装内容:
- `getSession()` でセッションの有効性を確認
- セッションがあれば `updateUser({ password })` でパスワード更新
- セッションがない場合はエラーメッセージを表示

#### コード例:
```typescript
useEffect(() => {
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
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (!error) {
    router.push('/login');
  }
};
```

---

### 4. 認証ミドルウェアの強化 (`src/lib/supabase/middleware.ts`)

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

#### 1. Redirect URLs の設定（重要）
1. Supabase ダッシュボードを開く
2. 「Authentication」→「URL Configuration」を開く
3. **Redirect URLs** に以下を追加:
   - 本番環境: `https://あなたの本番URL/auth/callback`
   - 開発環境: `http://localhost:3000/auth/callback`

**重要:** `/reset-password` を直接追加してはいけません。必ず `/auth/callback` を追加してください。

#### 2. 自己サインアップの無効化
1. Supabase ダッシュボードを開く
2. 「Authentication」→「Providers」→「Email」を選択
3. **「Enable Email provider」を ON に設定**
4. **「Confirm email」を OFF に設定**（招待制のため不要）
5. **「Allow new users to sign up」を OFF に設定**（重要）
6. 保存

#### 3. ユーザーの招待方法
1. 「Authentication」→「Users」を開く
2. 「Add user」ボタンをクリック
3. ユーザーのメールアドレスを入力
4. **パスワードを設定するか、「Auto generate password」を選択**
5. 「Create user」をクリック
6. ユーザーが作成されたら、**必ずパスワードリセットメールを送信**してユーザーに通知

#### 4. 初回ログイン時の対応

**ユーザーの初回ログイン手順:**
1. 管理者から招待されたことを確認
2. `/forgot-password` ページにアクセス
3. メールアドレスを入力してパスワードリセットメールを送信
4. メールに届いたリンクから `/reset-password` ページにアクセス
5. 新しいパスワードを設定
6. `/login` ページでメールアドレスとパスワードでログイン

#### 5. パスワード忘れ時の対応

**ユーザーから「パスワードを忘れた」と言われた場合:**
1. ユーザーに `/forgot-password` ページにアクセスしてもらう
2. メールアドレスを入力
3. パスワードリセットメールが送信される
4. メールのリンクから新しいパスワードを設定

#### 6. SMTP 設定（本番環境推奨）
1. 「Project Settings」→「Auth」を開く
2. 「SMTP Settings」を設定
3. Gmail 宛のメール送信には必須
4. 送信元メールアドレスを信頼できるドメインに設定（SPF/DKIM 推奨）

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
2. 招待されていないメールアドレスとパスワードを入力
3. 「ログイン」をクリック
4. **期待結果**: 「メールアドレスまたはパスワードが正しくありません。」と表示される

### 2. 招待されたメールでのログイン（初回）
1. Supabase ダッシュボードで「Authentication」→「Users」→「Add user」
2. ユーザーのメールアドレスを入力し、「Create user」を選択
3. ユーザーに `/forgot-password` ページにアクセスしてもらう
4. メールアドレスを入力してパスワードリセットメールを送信
5. メールに届いたリンクから `/reset-password` ページにアクセス
6. 新しいパスワード（6文字以上）を設定
7. `/login` ページでメールアドレスとパスワードでログイン
8. **期待結果**: 自動的にログインされ、`/dashboard` にリダイレクト

### 3. パスワードリセットのテスト
1. `/forgot-password` ページにアクセス
2. 既に招待済みのメールアドレスを入力
3. 「リセットメールを送信」をクリック
4. **期待結果**:
   - 「パスワードリセットメールを送信しました。メールをご確認ください。」と表示
   - メールボックスにパスワードリセットメールが届く
5. メールのリンクから `/reset-password` ページにアクセス
6. 新しいパスワードを設定
7. `/login` ページで新しいパスワードでログイン成功

### 4. 未認証での保護ページアクセス
1. ブラウザのシークレットモード（または別のブラウザ）で `/dashboard` に直接アクセス
2. **期待結果**: `/login?next=/dashboard` にリダイレクト
3. ログイン後、元の `/dashboard` に戻る

### 5. パスワード不一致のテスト
1. `/login` ページにアクセス
2. 正しいメールアドレスと間違ったパスワードを入力
3. 「ログイン」をクリック
4. **期待結果**: 「メールアドレスまたはパスワードが正しくありません。」と表示される

### 6. RLS の動作確認
1. ユーザーA でログイン
2. エントリを作成
3. ユーザーB でログイン
4. **期待結果**: ユーザーA のエントリは閲覧可能だが、編集・削除は不可

---

## トラブルシューティング

### 問題: パスワードリセットメールが届かない

**解決策**:
1. 迷惑メールフォルダを確認
2. Supabase ダッシュボードで「Authentication」→「Users」を確認
   - ユーザーが存在するか確認
3. SMTP 設定を確認（本番環境の場合）
   - 「Project Settings」→「Auth」→「SMTP Settings」
   - 送信元ドメインの SPF/DKIM 設定を確認
4. Supabase のメール送信制限を確認
   - 開発環境では1時間に3-4通の制限がある場合あり
   - 本番環境では独自 SMTP 推奨

### 問題: ログインできない（メールアドレスまたはパスワードが正しくない）

**解決策**:
1. パスワードを忘れた場合は `/forgot-password` でリセット
2. Supabase ダッシュボードで「Authentication」→「Users」を確認
   - ユーザーが存在するか確認
3. 招待されていないメールアドレスの場合は管理者に連絡
4. `profiles` テーブルで `active = true` になっているか確認:
   ```sql
   SELECT id, email, active FROM profiles WHERE email = 'user@example.com';
   ```
5. `active = false` の場合は以下で有効化:
   ```sql
   UPDATE profiles SET active = true WHERE email = 'user@example.com';
   ```

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

### 問題: パスワードリセット後もログインできない

**解決策**:
1. パスワードが6文字以上であることを確認
2. パスワードリセットリンクの有効期限（1時間）が切れていないか確認
3. 期限切れの場合は `/forgot-password` で再度リセットメールを送信
4. ブラウザのキャッシュをクリアして再試行

---

## 参考リンク

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-01-11 | パスワード認証方式に変更、パスワードリセット機能追加 |
| 2026-01-01 | Magic Link 方式に統一、UI 改善、再招待手順追加 |
| 2025-10-23 | 招待制システムの初回実装完了 |
