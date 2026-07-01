import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { runDolphinAgent } from "@/lib/ai/agent";
import { executeTool, type ToolExecutorContext } from "@/lib/ai/tool-executor";
import type { ToolName } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Το ANTHROPIC_API_KEY δεν έχει ρυθμιστεί." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    toolName?: ToolName;
    input?: Record<string, unknown>;
    toolUseId?: string;
    continuationMessages?: Anthropic.MessageParam[];
    chatId?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Μη έγκυρο αίτημα." }, { status: 400 });
  }

  if (!body.toolName || !body.toolUseId || !body.input) {
    return NextResponse.json({ error: "Απαιτούνται toolName, input, toolUseId." }, { status: 400 });
  }

  const ctx: ToolExecutorContext = {
    supabase,
    userId: user.id,
    userEmail: user.email ?? "—",
  };

  try {
    const toolResult = await executeTool(body.toolName, body.input, ctx);

    if (!body.continuationMessages?.length) {
      return NextResponse.json({
        message: toolResult,
        toolResult,
      });
    }

    const messages: Anthropic.MessageParam[] = [
      ...body.continuationMessages,
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: body.toolUseId,
            content: toolResult,
          },
        ],
      },
    ];

    const agentResult = await runDolphinAgent({
      anthropic,
      supabase,
      userId: user.id,
      userEmail: user.email ?? "—",
      messages,
      executeWrites: true,
    });

    if (body.chatId) {
      await supabase.from("ai_messages").insert({
        chat_id: body.chatId,
        role: "assistant",
        content: agentResult.message,
      });

      await supabase
        .from("ai_chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", body.chatId);
    }

    return NextResponse.json({
      message: agentResult.message,
      toolResult,
      pendingActions: agentResult.pendingActions,
      continuationMessages: agentResult.continuationMessages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Αποτυχία εκτέλεσης εργαλείου.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
