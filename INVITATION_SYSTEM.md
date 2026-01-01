# 招待制認証システム実装ドキュメント（Magic Link 方式）

## 概要

Time Bankアプリケーションは**招待制（Invitation-Only）+ Magic Link**システムです。
自己サインアップは無効化され、管理者が招待したユーザーのみがログインできます。

**認証方式**: Magic Link（OTP）
**パスワード**: 不要（メールで受け取ったリンクをクリックするだけでログイン）

## 実装内容

### 1. ログインページの変更 (`src/app/login/LoginForm.tsx`)

#### 変更点:
- **Magic Link（OTP）方式に統一**
  - `signInWithPassword` → `signInWithOtp` に変更
  - パスワード入力欄を削除
  - メールアドレスのみで認証

- **送信後の UI 改善**
  - 「メールを確認してください」の明示
  - 二重送信防止（`emailSent` フラグ）
  - 「メールが届かない場合」のヘルプ表示

- **エラーメッセージの統一**
  - 未招待メールでのログイン試行時: 「このメールアドレスは招待されていません。管理者にお問い合わせください。」

- **UI文言の更新**
  - 「招待制ログイン（Magic Link）」と明記
  - リンク有効期限（1時間）の表示
  - 迷惑メールフォルダの確認を促すガイド

#### コード例:
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
  },
});

if (error) {
  setMessage({
    type: 'error',
    text: 'このメールアドレスは招待されていません。管理者にお問い合わせください。'
  });
} else {
  setEmailSent(true);
  setMessage({
    type: 'success',
    text: 'ログインリンクを送信しました。メールをご確認ください。',
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
4. 「Confirm email」を ON に設定（推奨）
5. 保存

#### 2. ユーザーの招待方法
1. 「Authentication」→「Users」を開く
2. 「Add user」ボタンをクリック
3. ユーザーのメールアドレスを入力
4. **「Send Magic Link」を選択**（パスワードは不要）
5. ユーザーにマジックリンクが送信される
6. ユーザーはメール内のリンクをクリックするだけでログイン完了

#### 3. 再招待（リンク再送）の方法

**ユーザーから「メールが届かない」「リンクが期限切れ」と言われた場合:**

##### 方法A: Supabase Dashboard から Magic Link を再送（推奨）
1. Supabase ダッシュボードで「Authentication」→「Users」を開く
2. 対象ユーザーを検索（メールアドレスで）
3. ユーザー詳細画面で「Send Magic Link」をクリック
4. 新しいログインリンクがメールで送信される
5. ユーザーに再送した旨を連絡

##### 方法B: ユーザー自身がログイン画面から再送
1. ユーザーに `/login` ページにアクセスしてもらう
2. メールアドレスを入力して「ログインリンクを送信」をクリック
3. 招待済みのメールアドレスであれば、新しいリンクが送信される
4. メールが届かない場合は、迷惑メールフォルダを確認してもらう

**注意**: Magic Link の有効期限は1時間です。期限切れの場合は再送が必要です。

#### 4. SMTP 設定（本番環境推奨）
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
2. 招待されていないメールアドレスを入力
3. 「ログインリンクを送信」をクリック
4. **期待結果**: 「このメールアドレスは招待されていません。管理者にお問い合わせください。」と表示される
5. メールは送信されない

### 2. 招待されたメールでのログイン（初回）
1. Supabase ダッシュボードで「Authentication」→「Users」→「Add user」
2. ユーザーのメールアドレスを入力し、「Send Magic Link」を選択
3. ユーザーのメールボックスに届いた招待メールを開く
4. メール内の「Log In」ボタンまたはリンクをクリック
5. **期待結果**: 自動的にログインされ、`/` または `/dashboard` にリダイレクト
6. ナビゲーションバーに「マイページ」が表示される

### 3. Magic Link の再送テスト
1. `/login` ページにアクセス
2. 既に招待済みのメールアドレスを入力
3. 「ログインリンクを送信」をクリック
4. **期待結果**:
   - 「ログインリンクを送信しました。メールをご確認ください。」と表示
   - 入力欄が無効化され、「メール送信済み」ボタンに変わる
   - 「メールを確認してください」のヘルプボックスが表示
5. メールボックスに新しい Magic Link が届く
6. リンクをクリックしてログイン成功

### 4. 未認証での保護ページアクセス
1. ブラウザのシークレットモード（または別のブラウザ）で `/dashboard` に直接アクセス
2. **期待結果**: `/login?next=/dashboard` にリダイレクト
3. Magic Link でログイン後、元の `/dashboard` に戻る

### 5. Magic Link の有効期限テスト
1. `/login` でログインリンクを送信
2. メールを開くが、**1時間以上待つ**
3. リンクをクリック
4. **期待結果**: 期限切れエラーが表示される
5. `/login` で再度ログインリンクを送信してログイン成功

### 6. RLS の動作確認
1. ユーザーA でログイン
2. エントリを作成
3. ユーザーB でログイン
4. **期待結果**: ユーザーA のエントリは閲覧可能だが、編集・削除は不可

### 7. メールが届かない場合のヘルプ表示確認
1. `/login` でログインリンクを送信
2. **期待結果**: 以下のヘルプが表示される
   - 受信トレイに届いたログインリンクをクリックしてください
   - リンクの有効期限は1時間です
   - メールが届かない場合は、迷惑メールフォルダをご確認ください
   - それでも届かない場合は、管理者にお問い合わせください

---

## トラブルシューティング

### 問題: Magic Link のメールが届かない

**解決策**:
1. 迷惑メールフォルダを確認
2. Supabase ダッシュボードで「Authentication」→「Users」を確認
   - ユーザーが存在するか確認
   - 「Confirmed」状態になっているか確認
3. SMTP 設定を確認（本番環境の場合）
   - 「Project Settings」→「Auth」→「SMTP Settings」
   - 送信元ドメインの SPF/DKIM 設定を確認
4. Supabase のメール送信制限を確認
   - 開発環境では1時間に3-4通の制限がある場合あり
   - 本番環境では独自 SMTP 推奨

### 問題: Magic Link をクリックしても「Invalid or expired link」エラー

**解決策**:
1. Magic Link の有効期限は1時間です。期限切れの場合は再送が必要
2. `/login` で再度ログインリンクを送信
3. Supabase ダッシュボードで「Send Magic Link」を実行

### 問題: 招待したのにログインできない

**解決策**:
1. Supabase ダッシュボードで「Authentication」→「Users」を確認
2. ユーザーが「Confirmed」状態になっているか確認
3. `profiles` テーブルで `active = true` になっているか確認:
   ```sql
   SELECT id, email, active FROM profiles WHERE email = 'user@example.com';
   ```
4. `active = false` の場合は以下で有効化:
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

### 問題: 「別のメールアドレスで再送する」ボタンが表示されない

**解決策**:
1. ページをリロード（F5）
2. ブラウザキャッシュをクリア
3. シークレットモードで `/login` にアクセス

---

## 参考リンク

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-01-01 | Magic Link 方式に統一、UI 改善、再招待手順追加 |
| 2025-10-23 | 招待制システムの初回実装完了 |
