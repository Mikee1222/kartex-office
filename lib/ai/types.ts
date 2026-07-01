import type Anthropic from "@anthropic-ai/sdk";

import type { ToolName } from "@/lib/ai/tools";

export type PendingAction = {
  toolName: ToolName;
  input: Record<string, unknown>;
  description: string;
  toolUseId: string;
  destructive?: boolean;
};

export type DolphinAgentResult = {
  message: string;
  pendingActions: PendingAction[];
  continuationMessages?: Anthropic.MessageParam[];
};

export type ChatApiResponse = {
  message?: string;
  error?: string;
  pendingActions?: PendingAction[];
  continuationMessages?: Anthropic.MessageParam[];
};
