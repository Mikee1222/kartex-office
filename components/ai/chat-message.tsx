"use client";

import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  compact?: boolean;
};

const markdownClass =
  "text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0";

export function ChatMessageBubble({
  role,
  content,
  timestamp,
  compact = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-gradient-to-br from-gold-500 to-gold-400 text-navy-900"
            : "border border-gray-200/80 bg-white text-navy-900 shadow-card",
          compact && "max-w-full px-3 py-2",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <div className={markdownClass}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
      {timestamp ? (
        <span className="px-1 text-[10px] text-gray-400">{timestamp}</span>
      ) : null}
    </div>
  );
}

export function ChatLoadingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-card">
      <span className="size-2 animate-bounce rounded-full bg-gold-500 [animation-delay:0ms]" />
      <span className="size-2 animate-bounce rounded-full bg-gold-500 [animation-delay:150ms]" />
      <span className="size-2 animate-bounce rounded-full bg-gold-500 [animation-delay:300ms]" />
    </div>
  );
}
