"use client";

import * as React from "react";

import { useAiChat } from "@/lib/ai/use-ai-chat";

type AiChatContextValue = ReturnType<typeof useAiChat>;

const AiChatContext = React.createContext<AiChatContextValue | null>(null);

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const value = useAiChat();
  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChatContext() {
  const context = React.useContext(AiChatContext);
  if (!context) {
    throw new Error("useAiChatContext must be used within AiChatProvider");
  }
  return context;
}
