import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

import { DOLPHIN_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { executeTool, type ToolExecutorContext } from "@/lib/ai/tool-executor";
import type { DolphinAgentResult, PendingAction } from "@/lib/ai/types";
import {
  describePendingAction,
  DOLPHIN_TOOLS,
  isDestructiveTool,
  isWriteTool,
  type ToolName,
} from "@/lib/ai/tools";

const MODEL = "claude-sonnet-4-5";
const MAX_ITERATIONS = 10;

function extractAssistantText(
  content: Anthropic.Messages.Message["content"],
): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function toAnthropicMessages(
  messages: { role: "user" | "assistant"; content: string }[],
): Anthropic.MessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function runDolphinAgent(options: {
  anthropic: Anthropic;
  supabase: SupabaseClient;
  userId: string;
  userEmail: string;
  messages: Anthropic.MessageParam[];
  executeWrites?: boolean;
}): Promise<DolphinAgentResult> {
  const {
    anthropic,
    supabase,
    userId,
    userEmail,
    messages: initialMessages,
    executeWrites = false,
  } = options;

  const ctx: ToolExecutorContext = { supabase, userId, userEmail };
  let messages = [...initialMessages];
  const pendingActions: PendingAction[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: DOLPHIN_SYSTEM_PROMPT,
      tools: DOLPHIN_TOOLS,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      return {
        message:
          extractAssistantText(response.content) ||
          "Δεν μπόρεσα να δημιουργήσω απάντηση.",
        pendingActions,
      };
    }

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
    );

    const writeBlocks = toolUseBlocks.filter((block) => isWriteTool(block.name));
    const readBlocks = toolUseBlocks.filter((block) => !isWriteTool(block.name));

    if (writeBlocks.length > 0 && !executeWrites) {
      for (const block of writeBlocks) {
        const name = block.name as ToolName;
        const input = block.input as Record<string, unknown>;
        pendingActions.push({
          toolName: name,
          input,
          description: describePendingAction(name, input),
          toolUseId: block.id,
          destructive: isDestructiveTool(name, input),
        });
      }

      const readResults = await Promise.all(
        readBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: await executeTool(
            block.name as ToolName,
            block.input as Record<string, unknown>,
            ctx,
          ),
        })),
      );

      const pendingResults = writeBlocks.map((block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: JSON.stringify({
          status: "pending_confirmation",
          message: "Αναμένει επιβεβαίωση χρήστη πριν την εκτέλεση.",
        }),
      }));

      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: [...readResults, ...pendingResults] },
      ];

      const followUp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: DOLPHIN_SYSTEM_PROMPT,
        tools: DOLPHIN_TOOLS,
        messages,
      });

      const text = extractAssistantText(followUp.content);

      return {
        message:
          text ||
          "Χρειάζεται η επιβεβαίωσή σας για τις προτεινόμενες ενέργειες.",
        pendingActions,
        continuationMessages: messages,
      };
    }

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: await executeTool(
          block.name as ToolName,
          block.input as Record<string, unknown>,
          ctx,
        ),
      })),
    );

    messages = [
      ...messages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }

  return {
    message: "Υπερβήθηκε το όριο βημάτων του βοηθού. Δοκιμάστε πιο σύντομο αίτημα.",
    pendingActions,
  };
}

export function buildInitialMessages(
  uiMessages: { role: "user" | "assistant"; content: string }[],
): Anthropic.MessageParam[] {
  return toAnthropicMessages(uiMessages);
}
