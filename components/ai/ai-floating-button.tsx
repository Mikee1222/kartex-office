"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, X } from "lucide-react";
import { toast } from "sonner";

import { ChatInput } from "@/components/ai/chat-input";
import { ChatLoadingDots, ChatMessageBubble } from "@/components/ai/chat-message";
import { ToolConfirmationCard } from "@/components/ai/tool-confirmation-card";
import { useAiChatContext } from "@/lib/ai/ai-chat-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatTime(iso?: string) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DolphinWaveSvg({ className, stroke = "white" }: { className?: string; stroke?: string }) {
  return (
    <svg
      width="38"
      height="8"
      viewBox="0 0 38 8"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M0,4 C5,1 10,7 16,4 C22,1 27,7 32,4 C34,3 36,3 38,4"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      >
        <animate
          attributeName="d"
          dur="1.6s"
          repeatCount="indefinite"
          values="M0,4 C5,1 10,7 16,4 C22,1 27,7 32,4 C34,3 36,3 38,4;M0,4 C5,7 10,1 16,4 C22,7 27,1 32,4 C34,5 36,5 38,4;M0,4 C5,1 10,7 16,4 C22,1 27,7 32,4 C34,3 36,3 38,4"
        />
      </path>
    </svg>
  );
}

export function AiFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const {
    messages,
    loading,
    confirming,
    sendMessage,
    pendingActions,
    confirmPendingAction,
    dismissPendingAction,
  } = useAiChatContext();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const visibleMessages = messages.slice(-5);
  const onAssistantPage = pathname === "/assistant";

  React.useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, loading, open]);

  const handleSend = async () => {
    const text = input;
    setInput("");
    try {
      await sendMessage(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Σφάλμα αποστολής.");
    }
  };

  if (onAssistantPage) {
    return null;
  }

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-[104px] right-7 z-50 flex h-[min(70vh,520px)] w-[380px] max-w-[calc(100vw-3.5rem)] flex-col overflow-hidden rounded-3xl border border-gold-500/15 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-label="Dolphin AI"
        >
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-br from-navy-900 to-[#0A1628] px-4 py-3.5">
            <div className="relative shrink-0">
              <div className="flex size-11 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/15">
                <img
                  src="/logo-gold.png"
                  alt=""
                  className="size-7 object-contain"
                />
              </div>
              <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-navy-900 bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-wide text-gold-400">Dolphin AI</p>
              <p className="truncate text-[11px] text-white/45">
                Παραγγελίες, απόθεμα &amp; πελάτες
              </p>
            </div>
            <Link
              href="/assistant"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Maximize2 className="size-3" />
              Πλήρης οθόνη
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Κλείσιμο"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {visibleMessages.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <img
                  src="/logo-gold.png"
                  alt="Dolphin"
                  className="size-10 object-contain"
                  style={{ animation: "dolphin-bounce 3s ease-in-out infinite" }}
                />
                <p className="max-w-[240px] text-sm text-gray-500">
                  Ρωτήστε το Dolphin για παραγγελίες, απόθεμα ή πελάτες.
                </p>
              </div>
            ) : (
              visibleMessages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={formatTime(message.createdAt)}
                  compact
                />
              ))
            )}
            {loading ? <ChatLoadingDots /> : null}
            {pendingActions.map((action) => (
              <ToolConfirmationCard
                key={action.toolUseId}
                action={action}
                loading={confirming}
                onCancel={() => dismissPendingAction(action.toolUseId)}
                onConfirm={() => {
                  void confirmPendingAction(action)
                    .then((result) => {
                      const text = result?.toolResult ?? result?.message ?? "";
                      if (text.includes("Σφάλμα")) {
                        toast.error(text);
                      } else {
                        toast.success("✅ Έγινε!");
                      }
                    })
                    .catch((error) => {
                      toast.error(
                        error instanceof Error ? error.message : "❌ Σφάλμα",
                      );
                    });
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            disabled={loading || confirming}
            showHint={false}
            className="flex-shrink-0"
          />
        </div>
      ) : null}

      <div className="group fixed bottom-7 right-7 z-50">
        <span className="pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Dolphin AI
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "relative flex size-[62px] flex-col items-center justify-center rounded-full border-2 border-white/30 p-0",
            "bg-gradient-to-br from-[#C9A84C] via-[#E8C547] to-[#C9A84C]",
            "shadow-[0_4px_24px_rgba(201,168,76,0.5),0_0_0_4px_rgba(201,168,76,0.1)]",
            "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            "hover:scale-105 hover:shadow-[0_6px_28px_rgba(201,168,76,0.6),0_0_0_4px_rgba(201,168,76,0.15)]",
            open && "scale-[0.92] rotate-[10deg]",
          )}
          aria-label="Dolphin AI"
          aria-expanded={open}
        >
          <img
            src="/logo-gold.png"
            alt=""
            className="size-[34px] object-contain"
            style={{
              filter: "brightness(0) invert(1)",
              animation: open ? "none" : "dolphin-bounce 3s ease-in-out infinite",
            }}
          />
          <DolphinWaveSvg className="-mt-0.5" />
        </button>
      </div>
    </>
  );
}
