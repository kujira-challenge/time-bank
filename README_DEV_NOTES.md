# Time Bank - 開発者向けドキュメント

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルに以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. データベースマイグレーション

Supabaseダッシュボードまたはローカルで以下のSQLを実行:

```bash
psql -d your_database < supabase/migrations/20250123_admin_audit_feedbacks.sql
```

または Supabase CLI:

```bash
supabase db push
```

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 権限管理（Role-Based Access Control）

### ユーザーロール

- **member**: 通常のメンバー（デフォルト）
  - 自分のエントリの作成・編集・削除
  - 全エントリの閲覧
  - タスクの作成・編集（依頼者/担当者のみ）

- **admin**: 管理者
  - memberの全権限
  - **全ユーザーのエントリを編集・削除可能**
  - 監査履歴の閲覧

### 管理者権限の付与

Supabaseダッシュボードまたはpsqlで実行:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### アクティブユーザー管理（招待制）

新規ユーザーは自動的に `active = true` で作成されます。

ユーザーを無効化:

```sql
UPDATE public.profiles
SET active = false
WHERE email = 'user@example.com';
```

無効化されたユーザーは`ミドルウェアで自動的にログアウト`されます。

## ダッシュボードの使い方

### 表示内容

1. **個人統計カード**
   - 総記録時間
   - 平均評価（1-5）
   - 評価件数
   - 価値スコア（時間×1.0 + 評価×2.0）

2. **グラフ**
   - 週次推移（折れ線グラフ）: 自分の週ごとの記録時間
   - タグ別割合（円グラフ）: 全体のタグ分布
   - 全体TOP10（横棒グラフ）: 時間数上位10名

3. **月次ランキング**
   - 時間ランキング: 今月の時間数TOP10
   - 価値スコアランキング: 評価を加味したTOP10

### 価値スコアの計算式

```
価値スコア = (総時間 × 1.0) + (平均評価 × 2.0)
```

係数は環境変数で調整可能（将来対応予定）:
- `VALUE_SCORE_HOURS_WEIGHT`: デフォルト 1.0
- `VALUE_SCORE_RATING_WEIGHT`: デフォルト 2.0

## CSV エクスポート

### 当月データのエクスポート

ダッシュボード右上の**「当月CSVエクスポート」**ボタンをクリック、または:

```
/api/exports/entries.csv?month=YYYY-MM
```

### エクスポート内容

- 週開始日
- 時間
- タグ（セミコロン区切り）
- メモ
- 貢献者名
- メールアドレス
- 作成日時

### Excel対応

UTF-8 BOM付きで出力されるため、Excelで直接開いて文字化けしません。

## タグの管理

### タグの入力

- **複数選択**: チップ形式で複数タグを選択
- **サジェスト機能**: 既存タグから自動補完
- **正規化**: 自動で小文字化・トリム・重複除去
- **上限**: 最大10個

### タグのベストプラクティス

- 短く明確な名称（例: `開発`, `デザイン`, `ミーティング`）
- 一貫性のある命名（例: `frontend` vs `フロントエンド` を統一）
- 粒度を適切に（粗すぎず細かすぎず）

## エントリの編集・削除（管理者のみ）

### 編集手順

1. `/entries` ページでエントリ一覧を表示
2. **管理者のみ**、各エントリに「編集」ボタンが表示される
3. 編集モーダルで変更
4. 変更差分を確認後、保存
5. 変更履歴が `entries_history` テーブルに自動記録

### 監査履歴の確認

エントリ詳細の「履歴」タブで以下を確認:

- アクション（更新/削除）
- 実行者
- 変更前/変更後の内容（JSON）
- 実行日時

### RLSポリシー

```sql
-- 自分のエントリのみ更新・削除可能
CREATE POLICY "Users can update own entries"
ON public.entries FOR UPDATE
TO authenticated
USING (auth.uid() = contributor_id);

-- 管理者は全エントリを更新・削除可能
CREATE POLICY "entries_update_by_admin"
ON public.entries FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
```

## 週開始日のバリデーション

### 自動補正

入力された日付が月曜日でない場合、**最も近い前の月曜日**に自動補正されます。

例:
- 入力: 2025-01-22（水曜日）
- 保存: 2025-01-20（月曜日）

### フロントエンド

日付入力時に即座に補正され、UIに反映されます。

### バックエンド

Zodスキーマの `transform` で二重チェック:

```typescript
week_start: z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((val) => {
    const date = new Date(val + 'T00:00:00Z');
    const monday = getMondayOfWeek(date);
    return formatDateISO(monday);
  }),
```

## テスト

### ユニットテスト

```bash
npm test
```

### 監視モード

```bash
npm run test:watch
```

### カバレッジ

現在のテスト対象:
- ✅ Zodバリデーション（週開始補正、hours境界）
- ✅ タグ正規化（trim, lowercase, dedupe, limit）
- ⏳ TagMultiSelect UI（計画中）
- ⏳ ダッシュボード集計ロジック（計画中）

## CI/CD

GitHub Actionsワークフローを設定予定（`.github/workflows/ci.yml`）:

```yaml
- name: Type Check
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Test
  run: npm test
```

## トラブルシューティング

### 「not_invited」エラー

ユーザーが `active = false` の場合、ログイン後すぐにリダイレクトされます。

解決策:
```sql
UPDATE public.profiles SET active = true WHERE email = 'user@example.com';
```

### グラフが表示されない

1. データが存在するか確認: `/entries` で少なくとも1件のエントリを作成
2. ブラウザコンソールでエラーを確認
3. Supabase RPC関数 `get_user_weekly_hours` が正しく作成されているか確認

### CSVが文字化けする

- ✅ BOM付きUTF-8で出力済み
- Excelで直接開く場合は問題なし
- テキストエディタで開く場合、UTF-8として認識されているか確認

## データベーススキーマ

### 主要テーブル

```
profiles          - ユーザープロフィール（role, active）
entries           - 時間記録エントリ
entries_history   - エントリの監査履歴
tasks             - タスク依頼
task_feedbacks    - タスク評価（価値スコア用）
```

### ビュー

```
monthly_value_scores - 月次集計（時間・評価・スコア）
```

### RPC関数

```
get_user_weekly_hours(user_id, limit) - 週次時間集計
```

## サンプルデータ投入

開発・テスト用:

```sql
-- サンプルエントリ
INSERT INTO public.entries (week_start, hours, tags, note, contributor_id)
VALUES
  ('2025-01-20', 8.0, ARRAY['開発', 'frontend'], 'React開発', 'your-user-id'),
  ('2025-01-20', 4.5, ARRAY['デザイン', 'ui/ux'], 'デザインレビュー', 'your-user-id'),
  ('2025-01-13', 10.0, ARRAY['開発', 'backend'], 'API実装', 'your-user-id');

-- サンプルタスク評価
INSERT INTO public.task_feedbacks (task_id, reviewer_id, rating, comment)
VALUES
  ('task-uuid', 'reviewer-uuid', 5, '素晴らしい仕事でした');
```

## ライセンス・クレジット

- Next.js 15
- React 19
- Supabase
- Recharts
- Zod
- Tailwind CSS

---

**最終更新**: 2025-01-23
**ドキュメントバージョン**: 1.0
