"use client";

import type Anthropic from "@anthropic-ai/sdk";
import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import {
  createChat,
  deleteChat,
  getChats,
  getMessages,
  updateChatTitle,
  type AiChat,
  type AiMessage,
} from "@/lib/ai/chat-service";
import { DEFAULT_CHAT_TITLE } from "@/lib/ai/constants";
import type { ChatApiResponse, PendingAction } from "@/lib/ai/types";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

async function callChatApi(
  messages: UiMessage[],
  chatId: string,
): Promise<ChatApiResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = (await response.json()) as ChatApiResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Αποτυχία αποστολής.");
  }

  return data;
}

async function callExecuteToolApi(payload: {
  toolName: string;
  input: Record<string, unknown>;
  toolUseId: string;
  continuationMessages?: Anthropic.MessageParam[];
  chatId: string;
}): Promise<ChatApiResponse & { toolResult?: string }> {
  const response = await fetch("/api/ai/execute-tool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ChatApiResponse & {
    error?: string;
    toolResult?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Αποτυχία εκτέλεσης.");
  }

  return data;
}

export function useAiChat() {
  const supabase = React.useMemo(() => createClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<AiChat[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<UiMessage[]>([]);
  const [title, setTitle] = React.useState(DEFAULT_CHAT_TITLE);
  const [loading, setLoading] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [pendingActions, setPendingActions] = React.useState<PendingAction[]>([]);
  const [continuationMessages, setContinuationMessages] = React.useState<
    Anthropic.MessageParam[] | null
  >(null);

  const refreshChats = React.useCallback(async () => {
    if (!userId) return;
    const { chats: nextChats } = await getChats(supabase, userId);
    setChats(nextChats);
  }, [supabase, userId]);

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setBootstrapping(false);
        return;
      }

      setUserId(user.id);
      const { chats: initialChats } = await getChats(supabase, user.id);
      if (cancelled) return;
      setChats(initialChats);
      setBootstrapping(false);
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const loadChat = React.useCallback(
    async (chatId: string) => {
      setActiveChatId(chatId);
      setPendingActions([]);
      setContinuationMessages(null);
      const chat = chats.find((c) => c.id === chatId);
      setTitle(chat?.title ?? DEFAULT_CHAT_TITLE);

      const { messages: rows } = await getMessages(supabase, chatId);
      setMessages(
        rows.map((row: AiMessage) => ({
          id: row.id,
          role: row.role,
          content: row.content,
          createdAt: row.created_at,
        })),
      );
    },
    [chats, supabase],
  );

  const startNewChat = React.useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setTitle(DEFAULT_CHAT_TITLE);
    setPendingActions([]);
    setContinuationMessages(null);
  }, []);

  const ensureChat = React.useCallback(
    async (firstMessage: string) => {
      if (activeChatId) return activeChatId;
      if (!userId) throw new Error("Δεν είστε συνδεδεμένοι.");

      const { chat, error } = await createChat(supabase, userId, firstMessage);
      if (error || !chat) {
        throw new Error(error ?? "Αποτυχία δημιουργίας συνομιλίας.");
      }

      setActiveChatId(chat.id);
      setTitle(chat.title);
      await refreshChats();
      return chat.id;
    },
    [activeChatId, refreshChats, supabase, userId],
  );

  const applyAssistantResponse = React.useCallback(
    (data: ChatApiResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingActions(data.pendingActions ?? []);
      setContinuationMessages(data.continuationMessages ?? null);
    },
    [],
  );

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || confirming) return;

      const userMessage: UiMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const previousMessages = messages;
      const nextMessages = [...previousMessages, userMessage];
      setMessages(nextMessages);
      setPendingActions([]);
      setLoading(true);

      try {
        const chatId = await ensureChat(trimmed);
        const data = await callChatApi(nextMessages, chatId);
        applyAssistantResponse(data);
        await refreshChats();
      } catch (error) {
        setMessages(previousMessages);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      applyAssistantResponse,
      confirming,
      ensureChat,
      loading,
      messages,
      refreshChats,
    ],
  );

  const confirmPendingAction = React.useCallback(
    async (action: PendingAction) => {
      if (!activeChatId || confirming) return;

      setConfirming(true);
      try {
        const data = await callExecuteToolApi({
          toolName: action.toolName,
          input: action.input,
          toolUseId: action.toolUseId,
          continuationMessages: continuationMessages ?? undefined,
          chatId: activeChatId,
        });

        setPendingActions((prev) =>
          prev.filter((item) => item.toolUseId !== action.toolUseId),
        );

        if (data.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: data.message ?? "",
              createdAt: new Date().toISOString(),
            },
          ]);
        }

        if (data.pendingActions?.length) {
          setPendingActions(data.pendingActions);
          setContinuationMessages(data.continuationMessages ?? null);
        } else {
          setContinuationMessages(null);
        }

        return data;
      } finally {
        setConfirming(false);
      }
    },
    [activeChatId, confirming, continuationMessages],
  );

  const dismissPendingAction = React.useCallback((toolUseId: string) => {
    setPendingActions((prev) => prev.filter((item) => item.toolUseId !== toolUseId));
  }, []);

  const removeChat = React.useCallback(
    async (chatId: string) => {
      await deleteChat(supabase, chatId);
      if (activeChatId === chatId) {
        startNewChat();
      }
      await refreshChats();
    },
    [activeChatId, refreshChats, startNewChat, supabase],
  );

  const saveTitle = React.useCallback(
    async (nextTitle: string) => {
      const trimmed = nextTitle.trim() || DEFAULT_CHAT_TITLE;
      setTitle(trimmed);
      if (!activeChatId) return;
      await updateChatTitle(supabase, activeChatId, trimmed);
      await refreshChats();
    },
    [activeChatId, refreshChats, supabase],
  );

  const filteredChats = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => chat.title.toLowerCase().includes(q));
  }, [chats, search]);

  return {
    userId,
    chats: filteredChats,
    activeChatId,
    messages,
    title,
    loading,
    confirming,
    bootstrapping,
    search,
    pendingActions,
    setSearch,
    loadChat,
    startNewChat,
    sendMessage,
    confirmPendingAction,
    dismissPendingAction,
    removeChat,
    saveTitle,
    setTitle,
    refreshChats,
  };
}
