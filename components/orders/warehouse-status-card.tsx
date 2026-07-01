"use client";

import { Package } from "lucide-react";
import * as React from "react";

import { type OrderBoxPhoto } from "@/lib/orders/order-photos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogBody } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type WarehouseStatusCardProps = {
  boxesCount: number | null;
  boxesNotes: string | null;
  photos: OrderBoxPhoto[];
  loadingPhotos?: boolean;
};

export function WarehouseStatusCard({
  boxesCount,
  boxesNotes,
  photos,
  loadingPhotos = false,
}: WarehouseStatusCardProps) {
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = React.useState<string>("");

  const boxCountContent =
    boxesCount != null && boxesCount > 0 ? (
      <p className="flex items-center gap-1.5 text-sm font-medium text-kartex-navy">
        <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {boxesCount} {boxesCount === 1 ? "κιβώτιο" : "κιβώτια"}
      </p>
    ) : boxesCount === 0 ? (
      <p className="flex items-center gap-1.5 text-sm font-medium text-kartex-navy">
        <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        0 κιβώτια
      </p>
    ) : null;

  function openPhoto(photo: OrderBoxPhoto) {
    setLightboxUrl(photo.photoUrl);
    setLightboxLabel(
      photo.boxNumber != null ? `Κιβώτιο #${photo.boxNumber}` : "Φωτογραφία κιβωτίου",
    );
  }

  return (
    <>
      <Card className="border-border/80 shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">
            Κατάσταση Αποθήκης
          </CardTitle>
          <CardDescription>Στοιχεία συσκευασίας από την αποθήκη</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {boxCountContent ? (
            boxCountContent
          ) : (
            <p className="text-sm text-muted-foreground">
              Δεν έχει καταχωρηθεί αριθμός κιβωτίων ακόμα.
            </p>
          )}

          {boxesNotes?.trim() ? (
            <div className="rounded-md border border-border/80 bg-[#F8F9FC] px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Σημειώσεις κιβωτίων
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {boxesNotes.trim()}
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Φωτογραφίες κιβωτίων
            </p>
            {loadingPhotos ? (
              <p className="text-sm text-muted-foreground">Φόρτωση φωτογραφιών…</p>
            ) : photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Δεν υπάρχουν φωτογραφίες κιβωτίων.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <button
                      type="button"
                      onClick={() => openPhoto(photo)}
                      className={cn(
                        "group relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-[#F8F9FC]",
                        "transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/50",
                      )}
                      aria-label={
                        photo.boxNumber != null
                          ? `Προβολή φωτογραφίας κιβωτίου ${photo.boxNumber}`
                          : "Προβολή φωτογραφίας κιβωτίου"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.photoUrl}
                        alt=""
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                      {photo.boxNumber != null ? (
                        <span className="absolute bottom-1 left-1 rounded bg-kartex-navy/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          #{photo.boxNumber}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={lightboxUrl != null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxUrl(null);
            setLightboxLabel("");
          }
        }}
        title={lightboxLabel || "Φωτογραφία"}
        className="max-w-4xl"
      >
        <DialogBody className="flex items-center justify-center p-2">
          {lightboxUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt={lightboxLabel}
              className="max-h-[min(75vh,640px)] w-auto max-w-full rounded-md object-contain"
            />
          ) : null}
        </DialogBody>
      </Dialog>
    </>
  );
}
