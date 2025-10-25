-- ユーザープロフィールテーブル
-- auth.usersと1対1の関係
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー: 全ての認証済みユーザーは全てのプロフィールを読み取れる
-- 【招待制】認証済みユーザーのみアクセス可能 (auth.uid() で判定)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- プロフィールのポリシー: 自分のプロフィールのみ更新可能
-- 【招待制】認証済み & 自分のレコードのみ更新可能 (auth.uid() = id)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 貢献記録テーブル
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  tags TEXT[] DEFAULT '{}',
  note TEXT DEFAULT '',
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS を有効化
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- エントリのポリシー: 全ての認証済みユーザーは全てのエントリを読み取れる
-- 【招待制】認証済みユーザーのみアクセス可能
CREATE POLICY "Anyone can view entries"
  ON public.entries FOR SELECT
  TO authenticated
  USING (true);

-- エントリのポリシー: 認証済みユーザーは自分のエントリを作成可能
-- 【招待制】認証済み & 自分のレコードのみ作成可能 (auth.uid() = contributor_id)
CREATE POLICY "Users can create own entries"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);

-- エントリのポリシー: 自分のエントリのみ更新可能
-- 【招待制】認証済み & 自分のレコードのみ更新可能 (auth.uid() = contributor_id)
CREATE POLICY "Users can update own entries"
  ON public.entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = contributor_id);

-- エントリのポリシー: 自分のエントリのみ削除可能
-- 【招待制】認証済み & 自分のレコードのみ削除可能 (auth.uid() = contributor_id)
CREATE POLICY "Users can delete own entries"
  ON public.entries FOR DELETE
  TO authenticated
  USING (auth.uid() = contributor_id);

-- タスク依頼テーブル
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  estimated_hours NUMERIC(5, 2) CHECK (estimated_hours > 0),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS を有効化
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- タスクのポリシー: 全ての認証済みユーザーは全てのタスクを読み取れる
-- 【招待制】認証済みユーザーのみアクセス可能
CREATE POLICY "Anyone can view tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

-- タスクのポリシー: 認証済みユーザーは自分が依頼者のタスクを作成可能
-- 【招待制】認証済み & 自分が依頼者のレコードのみ作成可能 (auth.uid() = requester_id)
CREATE POLICY "Users can create own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- タスクのポリシー: 依頼者または担当者はタスクを更新可能
-- 【招待制】認証済み & (依頼者 OR 担当者) のみ更新可能
CREATE POLICY "Requester or assignee can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = assignee_id);

-- タスクのポリシー: 依頼者のみタスクを削除可能
-- 【招待制】認証済み & 依頼者のみ削除可能 (auth.uid() = requester_id)
CREATE POLICY "Requester can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_entries_contributor_id ON public.entries(contributor_id);
CREATE INDEX IF NOT EXISTS idx_entries_week_start ON public.entries(week_start);
CREATE INDEX IF NOT EXISTS idx_entries_tags ON public.entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_requester_id ON public.tasks(requester_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON public.tasks USING GIN(tags);

-- 自動でupdated_atを更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 新規ユーザー登録時に自動でプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersにトリガーを設定
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
