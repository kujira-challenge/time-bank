# Time Bank

Next.js 14 + TypeScript で構築された時間銀行とプロジェクト管理のためのアプリケーションです。

## 主要機能

### 時間銀行（メイン機能）
- **エントリ一覧** (`/entries`): 記録した時間の確認・管理・フィルタリング
- **エントリ作成** (`/entries/create`): 週別の時間記録とタグ付け
- **ダッシュボード** (`/dashboard`): 週別・タグ別の時間集計と分析

### 任意機能（機能フラグで制御）
- **テンプレート選択** (`/settings/templates`): Figma/FigJamテンプレートの選択と命名規約チェック
- **Asanaタスク作成** (`/tasks/create`): Asana REST APIを使ったタスク作成
- **設定確認** (`/integrations`): Asana連携の環境変数設定状況確認

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の変数を設定してください：

```env
# 機能フラグ（必須）
NEXT_PUBLIC_ENABLE_TEMPLATES=true  # テンプレート機能の有効/無効
NEXT_PUBLIC_ENABLE_ASANA=true      # Asana連携機能の有効/無効

# Asana連携設定（NEXT_PUBLIC_ENABLE_ASANA=true の場合のみ必要）
ASANA_PAT=your_personal_access_token_here
ASANA_WORKSPACE_GID=your_workspace_gid_here
ASANA_PROJECT_GID=your_project_gid_here
```

**機能フラグについて:**
- `NEXT_PUBLIC_ENABLE_TEMPLATES=false` にするとテンプレート機能がトップページから非表示になります
- `NEXT_PUBLIC_ENABLE_ASANA=false` にするとAsana関連機能がトップページから非表示になります
- 両方 `false` にすると時間銀行機能のみが表示されます

### 3. Asana設定の確認方法（Asana機能を使う場合）

#### Personal Access Token (PAT) の取得

1. [Asana Developer Console](https://app.asana.com/0/my-apps) にアクセス
2. "Personal access token" セクションで新しいトークンを作成
3. 作成されたトークンを `ASANA_PAT` に設定

#### Workspace GID の取得

1. Asanaにログインし、左サイドバーでワークスペース名をクリック
2. URLの数字部分がWorkspace GIDです（例：`https://app.asana.com/0/1234567890123456/list` の `1234567890123456`）

#### Project GID の取得

1. 対象のプロジェクトを開く
2. URLの数字部分がProject GIDです

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## ファイル構成

```
src/
├── app/
│   ├── page.tsx                      # ホーム画面（時間銀行優先）
│   ├── entries/
│   │   ├── page.tsx                  # エントリ一覧
│   │   └── create/page.tsx           # エントリ作成
│   ├── dashboard/page.tsx            # 時間集計ダッシュボード
│   ├── settings/
│   │   └── templates/page.tsx        # テンプレート選択
│   ├── tasks/
│   │   └── create/page.tsx           # Asanaタスク作成
│   ├── integrations/page.tsx         # 環境変数確認画面
│   ├── projects/
│   │   └── create/page.tsx           # @deprecated 旧テンプレート選択（非推奨）
│   └── api/
│       └── asana/
│           └── tasks/route.ts        # Asanaタスク作成API
├── lib/
│   └── timebank.ts                   # 時間銀行のlocalStorage CRUD
├── types/
│   └── index.ts                      # 型定義（Entry, TemplateItem）
└── config/
    └── templates.ts                  # テンプレート定義と命名規約
```

## 動作確認手順

### 1. 時間銀行の動作確認
1. トップページ (`/`) で時間銀行セクションが最上段に表示されることを確認
2. `/entries/create` で時間エントリを作成
   - 週開始日を選択
   - 時間数を入力（0.5時間単位）
   - タグを追加（カンマ区切り）
   - メモを記入
3. `/entries` で作成したエントリが表示されることを確認
   - 週開始日とタグでフィルタリング
   - エントリの削除
4. `/dashboard` で集計データが表示されることを確認
   - 総記録時間
   - 週別集計
   - タグ別集計

### 2. テンプレート機能の確認（NEXT_PUBLIC_ENABLE_TEMPLATES=true の場合）
1. トップページに「ツール集」セクションが表示されることを確認
2. `/settings/templates` にアクセス
3. テンプレートの検索機能をテスト
4. テンプレートカードから「Duplicate/コピー」ボタンをクリック（新規タブでFigmaが開く）
5. 命名規約チェック:
   - 正しい例: `PJ1-Kickoff-20251013`
   - 間違い例: `test` → 「NG」と表示されること
6. 「命名規約を確認」ボタンをクリック → ガイダンスアラートが表示

### 3. Asana連携の確認（NEXT_PUBLIC_ENABLE_ASANA=true の場合）
1. `/integrations` にアクセス
2. 環境変数が正しく設定されているか確認（すべて「設定済み」と表示）
3. `/tasks/create` にアクセス
4. 以下の内容でタスクを作成:
   - **name**: テスト
   - **notes**: APIから作成
   - **due_on**: 明日の日付
5. 「作成」ボタンをクリック
6. 成功アラートが表示され、Asanaプロジェクトにタスクが作成されること

### 4. 機能フラグの確認
1. `.env.local` で `NEXT_PUBLIC_ENABLE_TEMPLATES=false` に設定
2. 開発サーバーを再起動 (`npm run dev`)
3. トップページでテンプレート関連のカードが非表示になることを確認
4. 同様に `NEXT_PUBLIC_ENABLE_ASANA=false` でAsana関連が非表示になることを確認

## データ保存について

### 現在: localStorage（暫定実装）
- 時間銀行のエントリは **ブラウザのlocalStorage** に保存されます
- メリット: データベース不要で即座に使える
- デメリット:
  - ブラウザを変えると別のデータになる
  - データのバックアップが取りにくい
  - 複数端末での同期ができない

### 将来: Supabase + Prisma（計画）
スケールや複数端末対応が必要になった場合、以下の移行を予定:
1. `src/lib/timebank.ts` の関数をSupabase Client呼び出しに差し替え
2. Prisma でスキーマ管理
3. Supabase Auth でユーザー認証
4. 型定義 (`src/types/index.ts`) はそのまま流用

**移行時の利点:**
- 既存のUI層は変更不要（型が共通のため）
- localStorage関数とSupabase関数のインターフェースを揃えてあるため切り替えが容易

## テンプレートURLの差し替え方法

実際のFigmaテンプレートURLに差し替えるには、`src/config/templates.ts` を編集してください：

```typescript
export const TEMPLATES: TemplateItem[] = [
  {
    key: 'kickoff',
    label: 'Kick-off',
    kind: 'figjam',
    url: 'https://www.figma.com/community/file/実際のファイルID', // ここを変更
    description: 'キックオフミーティング用FigJamテンプレート',
  },
  // ... 他のテンプレート
];
```

テンプレートの追加・削除も同様に `templates.ts` を編集するだけでOKです。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **UI**: Tailwind CSS
- **バリデーション**: Zod
- **データ保存**: localStorage（暫定）→ Supabase + Prisma（将来）
- **API**: Asana REST API

## セキュリティ

- Asana Personal Access Token はサーバー側（Route Handler）でのみ使用
- クライアント側にPATが露出しない設計
- 機能フラグは `NEXT_PUBLIC_` プレフィックスで明示的にクライアント公開

## 既知の制限事項

1. **時間銀行データの保存**: localStorage のため、ブラウザを変えるとデータが引き継がれません
2. **テンプレートURL**: プレースホルダーのため、実際のFigmaテンプレートURLに差し替えが必要
3. **認証機能**: 未実装（将来のSupabase Auth導入を予定）
4. **プロジェクトURL保存**: 命名規約チェック後のURL保存機能は未実装

## 将来の拡張予定

- [ ] データベース連携（Supabase + Prisma）
- [ ] ユーザー認証（Supabase Auth）
- [ ] テンプレートコピー後のURL保存
- [ ] Figmaコメント読み取り
- [ ] Slack通知
- [ ] Asana/Jira OAuth化
- [ ] 時間エントリのCSVエクスポート
- [ ] 週次レポート自動生成

## トラブルシューティング

### トップページにツール集が表示されない
- `.env.local` で機能フラグが正しく設定されているか確認
- 開発サーバーを再起動 (`npm run dev`)

### Asanaタスク作成が失敗する
- `/integrations` で環境変数がすべて「設定済み」になっているか確認
- `NEXT_PUBLIC_ENABLE_ASANA=true` が設定されているか確認
- Asana PATの有効期限が切れていないか確認

### 時間エントリが保存されない
- ブラウザのlocalStorageが有効になっているか確認
- プライベートブラウジングモードでは動作しない可能性があります

## ライセンス

MIT
