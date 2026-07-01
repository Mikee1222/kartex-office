import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { buildInitialMessages, runDolphinAgent } from "@/lib/ai/agent";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

  let body: { messages?: ChatMessage[]; chatId?: string };
  try {
    body = (await req.json()) as { messages?: ChatMessage[]; chatId?: string };
  } catch {
    return NextResponse.json({ error: "Μη έγκυρο αίτημα." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const chatId = body.chatId;

  if (messages.length === 0) {
    return NextResponse.json({ error: "Απαιτούνται μηνύματα." }, { status: 400 });
  }

  try {
    const result = await runDolphinAgent({
      anthropic,
      supabase,
      userId: user.id,
      userEmail: user.email ?? "—",
      messages: buildInitialMessages(messages),
      executeWrites: false,
    });

    if (chatId) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

      if (lastUserMessage) {
        await supabase.from("ai_messages").insert([
          { chat_id: chatId, role: "user", content: lastUserMessage.content },
          { chat_id: chatId, role: "assistant", content: result.message },
        ]);
      } else {
        await supabase.from("ai_messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: result.message,
        });
      }

      await supabase
        .from("ai_chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId);
    }

    return NextResponse.json({
      message: result.message,
      pendingActions: result.pendingActions,
      continuationMessages: result.continuationMessages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Αποτυχία επικοινωνίας με το AI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
