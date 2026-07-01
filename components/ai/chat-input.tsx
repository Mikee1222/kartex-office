"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  showHint?: boolean;
  className?: string;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Γράψτε το μήνυμά σας…",
  showHint = true,
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 4 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  React.useEffect(() => {
    resize();
  }, [value, resize]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className={cn("border-t border-gray-200/80 bg-white p-3", className)}>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-60"
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(premiumGoldButton, "h-11 shrink-0 px-3")}
          aria-label="Αποστολή"
        >
          <Send className="size-4" />
        </Button>
      </div>
      {showHint ? (
        <p className="mt-1.5 text-[10px] text-gray-400">Shift+Enter για νέα γραμμή</p>
      ) : null}
    </div>
  );
}
