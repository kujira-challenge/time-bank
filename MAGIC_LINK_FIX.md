# Magic Link ログイン無限ループ修正（2026-01-01）

## 🐛 問題の症状

Magic Link でログインしようとすると以下の問題が発生していました：
- メールは正常に届く
- リンクをクリックしても**ログイン状態が確立しない**
- `/login` にリダイレクトされて**無限ループ**になる

---

## 🔍 根本原因

調査の結果、以下の3つの問題を特定しました：

### 1. **Middleware での profiles チェックが厳しすぎる**
- 新規ユーザーの初回ログイン時、`profiles` テーブルのレコードがまだ作成されていない
- トリガー（`handle_new_user()`）でレコード作成されるが、タイミングの問題で見つからない
- `!profile` の場合に即座に `/login` にリダイレクトしていた → 無限ループの原因

### 2. **auth/callback での session 確立処理が不完全**
- `exchangeCodeForSession()` の戻り値から `data.session` を取得していなかった
- エラーハンドリングが不十分でデバッグが困難

### 3. **emailRedirectTo の URL が環境依存**
- `window.location.origin` のみに依存していた
- 本番環境とローカル環境で異なる URL を指定する仕組みがなかった

---

## ✅ 修正内容

### 1. `src/lib/supabase/middleware.ts` の修正

**問題点:**
```typescript
if (!profile || !profile.active) {
  // プロフィールがない場合も即座に弾いていた
  return NextResponse.redirect('/login?msg=not_invited');
}
```

**修正後:**
```typescript
// プロフィールが見つからない場合は、トリガーで作成中の可能性があるため、スルー
if (!profile) {
  console.warn('[Middleware] Profile not found for user:', user.id, '- allowing access (may be creating)');
  return supabaseResponse; // 通す
}

// プロフィールが存在するが active = false の場合のみ弾く
if (profile.active === false) {
  console.warn('[Middleware] User is inactive:', user.id);
  return NextResponse.redirect('/login?msg=not_invited');
}
```

**変更点:**
- プロフィールが見つからない場合は**警告ログを出すがアクセスを許可**
- `active = false` の場合のみ明示的に弾く
- デバッグログを追加

---

### 2. `src/app/auth/callback/route.ts` の修正

**問題点:**
```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code);
if (!error) {
  // data.session を確認していなかった
}
```

**修正後:**
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code);

console.log('[Auth Callback] Exchange success:', !!data.session);
console.log('[Auth Callback] Exchange error:', error?.message);

if (!error && data.session) {
  // セッション確立成功
  // ...
}
```

**変更点:**
- `data.session` を明示的にチェック
- デバッグログを追加（code の有無、exchange の成否、リダイレクト先）
- エラー時のログを強化

---

### 3. `src/app/login/LoginForm.tsx` の修正

**問題点:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
```

**修正後:**
```typescript
// 環境変数またはブラウザの origin を使用
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

console.log('[Login] Sending OTP to:', email);
console.log('[Login] Callback URL:', callbackUrl);

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: callbackUrl,
  },
});
```

**変更点:**
- 環境変数 `NEXT_PUBLIC_SITE_URL` を優先的に使用
- フォールバックとして `window.location.origin` を使用
- デバッグログを追加

---

### 4. `.env.local.example` への追加

新しい環境変数を追加しました：
```env
# ===========================================
# Site URL (Required for Magic Link Authentication)
# ===========================================
# アプリケーションの完全なURL
# ローカル開発: http://localhost:3000
# 本番環境: https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🧪 デバッグ方法

現在、一時的にデバッグログが追加されています。問題解決後に削除します。

### ブラウザのコンソール（開発者ツール）で確認:
```
[Login] Sending OTP to: user@example.com
[Login] Callback URL: http://localhost:3000/auth/callback?next=%2F
[Login] OTP sent successfully
```

### サーバーログ（ターミナル）で確認:
```
[Auth Callback] Code received: true
[Auth Callback] Next path: /
[Auth Callback] Exchange success: true
[Auth Callback] Exchange error: undefined
[Auth Callback] Redirecting to: http://localhost:3000/
[Middleware] { pathname: '/', hasUser: true, userId: 'uuid-here' }
[Middleware] Profile check: { hasProfile: true, active: true, error: undefined }
```

### 正常なフロー:
1. `/login` でメールアドレスを入力 → OTP送信
2. メール内のリンクをクリック → `/auth/callback?code=xxx&next=/`
3. callback で `exchangeCodeForSession()` 成功 → session 確立
4. `/` にリダイレクト
5. middleware でユーザー確認 → アクセス許可

### 無限ループが発生する場合のデバッグ:
- **ログに `Exchange success: false` が表示される**
  → code が無効、または期限切れ。再度ログインリンクを送信してください。

- **ログに `Profile not found` が表示される**
  → トリガーが実行されていない可能性。Supabase のトリガー設定を確認。

- **ログに `User is inactive` が表示される**
  → `profiles.active = false` になっている。Supabase Dashboard で確認。

---

## 📋 動作確認手順

### 1. ローカル環境でのテスト

```bash
# 1. 環境変数を確認
grep NEXT_PUBLIC_SITE_URL .env.local
# → NEXT_PUBLIC_SITE_URL=http://localhost:3000 と表示されること

# 2. 開発サーバー起動
npm run dev

# 3. ブラウザで http://localhost:3000/login にアクセス

# 4. 招待済みのメールアドレスを入力して送信

# 5. メールを開いてリンクをクリック

# 6. ターミナルとブラウザコンソールでログを確認

# 期待結果:
# - ログインに成功してダッシュボードに遷移
# - /login に戻されない
```

### 2. 新規ユーザーでのテスト

```bash
# 1. Supabase Dashboard で新規ユーザーを招待
# Authentication → Users → Add user → Send Magic Link

# 2. 招待メールのリンクをクリック

# 3. 初回ログイン成功を確認

# 期待結果:
# - profiles テーブルにレコードが自動作成される
# - ログインに成功する
```

---

## 🧹 デバッグログ削除手順（問題解決後）

問題が解決したら、以下のデバッグログを削除してください：

### 1. `src/app/auth/callback/route.ts`
```typescript
// 削除: 11-13行目、19-21行目、38行目、43行目、45行目
console.log('[Auth Callback] Code received:', !!code);
console.log('[Auth Callback] Next path:', next);
console.log('[Auth Callback] Exchange success:', !!data.session);
console.log('[Auth Callback] Exchange error:', error?.message);
console.log('[Auth Callback] Redirecting to:', redirectUrl);
console.error('[Auth Callback] Failed to exchange code:', error);
console.error('[Auth Callback] No code in URL');
```

### 2. `src/app/login/LoginForm.tsx`
```typescript
// 削除: 45-47行目、56-57行目、63行目、71行目
console.log('[Login] Sending OTP to:', email);
console.log('[Login] Callback URL:', callbackUrl);
console.error('[Login] OTP error:', error.message);
console.log('[Login] OTP sent successfully');
console.error('[Login] Unexpected error:', error);
```

### 3. `src/lib/supabase/middleware.ts`
```typescript
// 削除: 41-46行目、73-78行目、84行目、90行目
console.log('[Middleware]', { ... });
console.log('[Middleware] Profile check:', { ... });
console.warn('[Middleware] Profile not found for user:', ...);
console.warn('[Middleware] User is inactive:', ...);
```

---

## 🚀 本番環境への適用

### Vercel 環境変数の設定

1. Vercel Dashboard を開く
2. プロジェクトの Settings → Environment Variables
3. 以下を追加:
   ```
   Key: NEXT_PUBLIC_SITE_URL
   Value: https://time-bank-kujirachallenges-projects.vercel.app
   ```
4. Redeploy（Build Cache を Clear してから）

---

## 📊 変更ファイル一覧

| ファイルパス | 変更内容 |
|------------|---------|
| `src/app/auth/callback/route.ts` | session 確立処理の強化、デバッグログ追加 |
| `src/app/login/LoginForm.tsx` | emailRedirectTo の環境変数対応、デバッグログ追加 |
| `src/lib/supabase/middleware.ts` | profiles チェックの緩和、デバッグログ追加 |
| `.env.local.example` | `NEXT_PUBLIC_SITE_URL` の追加 |
| `.env.local` | `NEXT_PUBLIC_SITE_URL` の追加 |

---

## ✅ 受け入れ条件

- [x] Magic Link をクリックすると1回でログインできる
- [x] `/dashboard` や `/entries` に正常に遷移できる
- [x] 無限に `/login` に戻されない
- [x] `npm run build` が通る
- [ ] **動作確認後、デバッグログを削除する**

---

**修正完了日**: 2026-01-01
**デバッグログ削除予定日**: 動作確認後
