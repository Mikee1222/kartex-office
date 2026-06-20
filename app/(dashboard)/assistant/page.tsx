import type { Metadata } from "next";

import { AssistantPage } from "@/components/ai/assistant-page";

export const metadata: Metadata = {
  title: "Dolphin",
};

export default function AssistantRoutePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AssistantPage />
    </div>
  );
}
