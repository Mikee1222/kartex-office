"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";

type OverCapacityModalsProps = {
  open: boolean;
  step: "first" | "second" | null;
  currentBoxes: number;
  maxBoxes: number;
  orderBoxes: number;
  onCancel: () => void;
  onContinueFirst: () => void;
  onConfirmFinal: () => void;
  confirming?: boolean;
  /** Trip add-order flow uses different copy. */
  variant?: "vehicle" | "trip";
  firstConfirmLabel?: React.ReactNode;
  finalConfirmLabel?: React.ReactNode;
};

export function OverCapacityModals({
  open,
  step,
  currentBoxes,
  maxBoxes,
  orderBoxes,
  onCancel,
  onContinueFirst,
  onConfirmFinal,
  confirming = false,
  variant = "vehicle",
  firstConfirmLabel,
  finalConfirmLabel,
}: OverCapacityModalsProps) {
  const total = currentBoxes + orderBoxes;
  const overBy = total - maxBoxes;
  const isTrip = variant === "trip";
  const entity = isTrip ? "δρομολόγιο" : "φορτηγό";

  return (
  <>
    <Dialog
      open={open && step === "first"}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="size-5 shrink-0 text-amber-500" aria-hidden />
          Υπέρβαση χωρητικότητας!
        </span>
      }
      className="max-w-lg"
    >
      <DialogBody className="space-y-3 text-sm text-foreground">
        {isTrip ? (
          <>
            <p>
              Το δρομολόγιο έχει {currentBoxes}/{maxBoxes} κιβώτια. Η παραγγελία έχει{" "}
              {orderBoxes} κιβώτια.
            </p>
            <p className="font-semibold text-destructive">
              Υπέρβαση: {overBy} κιβώτια!
            </p>
          </>
        ) : (
          <>
            <p>
              Το {entity} έχει {currentBoxes}/{maxBoxes} κιβώτια. Η παραγγελία έχει{" "}
              {orderBoxes} κιβώτια.
            </p>
            <p className="font-semibold text-destructive">
              Σύνολο: {total} &gt; {maxBoxes}
            </p>
          </>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Ακύρωση
        </Button>
        <Button type="button" variant="destructive" onClick={onContinueFirst}>
          {firstConfirmLabel ?? (isTrip ? "Κατανοώ, συνέχεια" : "Συνέχεια παρά ταύτα")}
        </Button>
      </DialogFooter>
    </Dialog>

    <Dialog
      open={open && step === "second"}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Είστε ΣΙΓΟΥΡΟΙ;"
      className="max-w-lg"
    >
      <DialogBody className="text-sm text-foreground">
        <p>
          {isTrip
            ? `Το δρομολόγιο θα υπερφορτωθεί κατά ${overBy} κιβώτια. Θέλετε να συνεχίσετε;`
            : `Το ${entity} θα υπερφορτωθεί κατά ${overBy} κιβώτια. Θέλετε να συνεχίσετε;`}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={confirming}>
          Ακύρωση
        </Button>
        <Button
          type="button"
          className="bg-kartex-gold text-kartex-navy hover:bg-kartex-gold/90"
          onClick={onConfirmFinal}
          disabled={confirming}
        >
          {confirming ? (
            "Αποθήκευση…"
          ) : (
            finalConfirmLabel ?? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                ΝΑΙ, ΕΠΙΒΕΒΑΙΩΝΩ
              </span>
            )
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  </>
  );
}
