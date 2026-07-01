"use client";

import * as React from "react";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { premiumGoldButton, premiumSecondaryButton } from "@/lib/ui/premium-styles";
import type { PendingAction } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

type ToolConfirmationCardProps = {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ToolConfirmationCard({
  action,
  onConfirm,
  onCancel,
  loading = false,
}: ToolConfirmationCardProps) {
  const [destructiveStep, setDestructiveStep] = React.useState(0);

  const handleConfirm = () => {
    if (action.destructive && destructiveStep === 0) {
      setDestructiveStep(1);
      return;
    }
    onConfirm();
    setDestructiveStep(0);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 shadow-card">
      <div className="flex items-start gap-2">
        <Zap className="mt-0.5 size-5 shrink-0 text-gold-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy-900">
            Ο Dolphin θέλει να κάνει:
          </p>
          <p className="mt-1 text-sm text-gray-600">{action.description}</p>
          {action.destructive && destructiveStep === 1 ? (
            <p className="mt-2 text-xs font-medium text-danger">
              Είστε σίγουροι; Η ενέργεια δεν αναιρείται εύκολα.
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className={premiumSecondaryButton}
          onClick={() => {
            setDestructiveStep(0);
            onCancel();
          }}
          disabled={loading}
        >
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={cn(
            premiumGoldButton,
            action.destructive && destructiveStep === 1 && "bg-danger hover:bg-danger/90",
          )}
          onClick={handleConfirm}
          disabled={loading}
        >
          {action.destructive && destructiveStep === 0
            ? "Συνέχεια"
            : "✅ Επιβεβαίωση"}
        </Button>
      </div>
    </div>
  );
}
