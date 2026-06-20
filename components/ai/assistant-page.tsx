"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { el } from "date-fns/locale";
import {
  MessageSquarePlus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ChatInput } from "@/components/ai/chat-input";
import { ChatLoadingDots, ChatMessageBubble } from "@/components/ai/chat-message";
import { ToolConfirmationCard } from "@/components/ai/tool-confirmation-card";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/constants";
import { useAiChatContext } from "@/lib/ai/ai-chat-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  premiumGoldButton,
  premiumInputFocus,
  premiumSecondaryButton,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

function formatRelativeDate(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: el });
}

function formatTime(iso?: string) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssistantPage() {
  const {
    chats,
    activeChatId,
    messages,
    title,
    loading,
    bootstrapping,
    search,
    setSearch,
    loadChat,
    startNewChat,
    sendMessage,
    confirmPendingAction,
    dismissPendingAction,
    pendingActions,
    confirming,
    removeChat,
    saveTitle,
    setTitle,
  } = useAiChatContext();

  const [input, setInput] = React.useState("");
  const [editingTitle, setEditingTitle] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input;
    setInput("");
    try {
      await sendMessage(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Σφάλμα αποστολής.");
    }
  };

  const handleSuggested = async (question: string) => {
    setInput(question);
    try {
      await sendMessage(question);
      setInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Σφάλμα αποστολής.");
    }
  };

  const handleConfirmAction = async (
    action: (typeof pendingActions)[number],
  ) => {
    try {
      const result = await confirmPendingAction(action);
      const text = result?.toolResult ?? result?.message ?? "";
      if (text.includes("Σφάλμα")) {
        toast.error(text);
      } else {
        toast.success("✅ Έγινε!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "❌ Σφάλμα");
    }
  };

  return (
    <div className="-m-4 flex h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-card sm:-m-6 lg:-m-8">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-gray-200/80 bg-gray-50/60">
        <div className="space-y-3 border-b border-gray-200/80 p-4">
          <Button
            type="button"
            className={cn(premiumGoldButton, "w-full")}
            onClick={startNewChat}
          >
            <MessageSquarePlus className="size-4" />
            Νέα Συνομιλία
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Αναζήτηση..."
              className={cn("h-9 pl-9", premiumInputFocus)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {bootstrapping ? (
            <p className="px-3 py-4 text-sm text-gray-400">Φόρτωση…</p>
          ) : chats.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-400">Δεν υπάρχουν συνομιλίες ακόμα.</p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => {
                const active = chat.id === activeChatId;
                return (
                  <li key={chat.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => void loadChat(chat.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-l-[3px] border-l-gold-500 bg-white pl-[9px] shadow-sm"
                          : "border-l-[3px] border-l-transparent hover:bg-white/80",
                      )}
                    >
                      <span className="block truncate text-sm font-medium text-navy-900">
                        {chat.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-gray-400">
                        {formatRelativeDate(chat.updated_at)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeChat(chat.id)}
                      className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                      aria-label="Διαγραφή συνομιλίας"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-gray-200/80 px-5 py-3 bg-white min-h-[52px]">
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                void saveTitle(title);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              autoFocus
              className="h-8 max-w-xs rounded-lg border border-border bg-background px-3 text-sm font-medium text-navy-900 focus:outline-none"
            />
          ) : activeChatId ? (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="truncate text-sm font-medium text-gray-600 hover:text-kartex-gold transition-colors"
            >
              {title}
            </button>
          ) : (
            <span className="text-sm text-gray-400">Dolphin&apos;s Office</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={startNewChat}>
              <MessageSquarePlus className="size-4 text-gray-500" />
            </Button>
            {activeChatId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void removeChat(activeChatId)}
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !loading ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-12 text-center">
              <div className="flex flex-col items-center gap-1">
                <img
                  src="/logo-gold.png"
                  alt="Dolphin"
                  style={{
                    width: "64px",
                    height: "64px",
                    objectFit: "contain",
                    animation: "dolphin-bounce 3s ease-in-out infinite",
                  }}
                />
                <svg
                  width="80"
                  height="14"
                  viewBox="0 0 80 14"
                  fill="none"
                  style={{ marginTop: "-4px" }}
                >
                  <path
                    d="M0,7 C8,3 16,11 24,7 C32,3 40,11 48,7 C56,3 64,11 72,7 C75,5 78,7 80,7"
                    stroke="#C9A84C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="d"
                      dur="2s"
                      repeatCount="indefinite"
                      values="M0,7 C8,3 16,11 24,7 C32,3 40,11 48,7 C56,3 64,11 72,7 C75,5 78,7 80,7;M0,7 C8,11 16,3 24,7 C32,11 40,3 48,7 C56,11 64,3 72,7 C75,9 78,7 80,7;M0,7 C8,3 16,11 24,7 C32,3 40,11 48,7 C56,3 64,11 72,7 C75,5 78,7 80,7"
                    />
                  </path>
                </svg>
              </div>
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#C9A84C", letterSpacing: "2px" }}
                >
                  DOLPHIN&apos;S OFFICE
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Ο AI βοηθός σας για παραγγελίες, απόθεμα, πελάτες και αναλύσεις.
                </p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void handleSuggested(question)}
                    className={cn(
                      premiumSecondaryButton,
                      "justify-start px-4 py-3 text-left text-sm",
                    )}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={formatTime(message.createdAt)}
                />
              ))}
              {loading ? <ChatLoadingDots /> : null}
              {pendingActions.map((action) => (
                <ToolConfirmationCard
                  key={action.toolUseId}
                  action={action}
                  loading={confirming}
                  onCancel={() => dismissPendingAction(action.toolUseId)}
                  onConfirm={() => void handleConfirmAction(action)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => void handleSend()}
          disabled={loading || confirming}
          className="shrink-0"
        />
      </section>
    </div>
  );
}
