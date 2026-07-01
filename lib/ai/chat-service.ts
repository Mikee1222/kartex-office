import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_CHAT_TITLE } from "@/lib/ai/constants";

export type AiChat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AiMessage = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function titleFromMessage(firstMessage?: string) {
  const trimmed = firstMessage?.trim();
  if (!trimmed) return DEFAULT_CHAT_TITLE;
  return trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed;
}

export async function createChat(
  supabase: SupabaseClient,
  userId: string,
  firstMessage?: string,
): Promise<{ chat: AiChat | null; error: string | null }> {
  const { data, error } = await supabase
    .from("ai_chats")
    .insert({
      user_id: userId,
      title: titleFromMessage(firstMessage),
    })
    .select("*")
    .single();

  if (error) {
    return { chat: null, error: error.message };
  }

  return { chat: data as AiChat, error: null };
}

export async function getChats(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ chats: AiChat[]; error: string | null }> {
  const { data, error } = await supabase
    .from("ai_chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { chats: [], error: error.message };
  }

  return { chats: (data ?? []) as AiChat[], error: null };
}

export async function getMessages(
  supabase: SupabaseClient,
  chatId: string,
): Promise<{ messages: AiMessage[]; error: string | null }> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [], error: error.message };
  }

  return { messages: (data ?? []) as AiMessage[], error: null };
}

export async function deleteChat(
  supabase: SupabaseClient,
  chatId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("ai_chats").delete().eq("id", chatId);

  return { error: error?.message ?? null };
}

export async function updateChatTitle(
  supabase: SupabaseClient,
  chatId: string,
  title: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("ai_chats")
    .update({ title: title.trim() || DEFAULT_CHAT_TITLE, updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return { error: error?.message ?? null };
}
