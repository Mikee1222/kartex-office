-- Dolphin chat history

CREATE TABLE IF NOT EXISTS public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null default 'Νέα συνομιλία',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references ai_chats(id) on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chats_own" ON ai_chats
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_messages_own" ON ai_messages
  FOR ALL TO authenticated
  USING (chat_id IN (
    SELECT id FROM ai_chats WHERE user_id = auth.uid()
  ))
  WITH CHECK (chat_id IN (
    SELECT id FROM ai_chats WHERE user_id = auth.uid()
  ));

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ai_chats, ai_messages TO authenticated;
