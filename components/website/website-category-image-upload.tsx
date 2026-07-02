"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { postWebsiteImageUpload } from "@/lib/website/client-image-upload";
import {
  MAX_RAW_UPLOAD_BYTES,
  UPLOAD_MIME_ERROR_EL,
  UPLOAD_SIZE_ERROR_EL,
} from "@/lib/website/constants";
import {
  isAllowedProductImageFile,
  mapUploadStatusToGreekError,
  readUploadJsonResponse,
} from "@/lib/website/product-image-upload";
import { cn } from "@/lib/utils";

type CatalogImageEntity = "category" | "subcategory";

type WebsiteCategoryImageUploadProps = {
  entityType: CatalogImageEntity;
  entityId?: string;
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  disabled?: boolean;
  compact?: boolean;
};

function imageApiPath(entityType: CatalogImageEntity, entityId: string): string {
  return entityType === "category"
    ? `/api/website/categories/${entityId}/image`
    : `/api/website/subcategories/${entityId}/image`;
}

export function WebsiteCategoryImageUpload({
  entityType,
  entityId,
  imageUrl,
  onImageUrlChange,
  pendingFile,
  onPendingFileChange,
  disabled,
  compact,
}: WebsiteCategoryImageUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(pendingFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingFile]);

  const displayUrl = previewUrl ?? imageUrl;

  async function uploadFile(file: File) {
    if (!isAllowedProductImageFile(file)) {
      toast.error(UPLOAD_MIME_ERROR_EL);
      return;
    }

    if (file.size > MAX_RAW_UPLOAD_BYTES) {
      toast.error(UPLOAD_SIZE_ERROR_EL);
      return;
    }

    if (!entityId) {
      onPendingFileChange(file);
      return;
    }

    setUploading(true);

    try {
      const response = await postWebsiteImageUpload(file, imageApiPath(entityType, entityId));
      const payload = await readUploadJsonResponse<{ imageUrl?: string; error?: string }>(
        response,
      );

      if (!response.ok || !payload.imageUrl) {
        throw new Error(
          payload.error ?? mapUploadStatusToGreekError(response.status),
        );
      }

      onPendingFileChange(null);
      onImageUrlChange(payload.imageUrl);
      toast.success("Η εικόνα ανέβηκε.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : mapUploadStatusToGreekError(500),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!entityId) {
      onPendingFileChange(null);
      onImageUrlChange(null);
      return;
    }

    if (!imageUrl && !pendingFile) return;

    setUploading(true);
    try {
      const response = await fetch(imageApiPath(entityType, entityId), {
        method: "DELETE",
      });
      const payload = await readUploadJsonResponse<{ imageUrl?: null; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          payload.error ?? mapUploadStatusToGreekError(response.status),
        );
      }

      onPendingFileChange(null);
      onImageUrlChange(null);
      toast.success("Η εικόνα αφαιρέθηκε.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : mapUploadStatusToGreekError(500),
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(fileList: FileList | File[]) {
    const file = Array.from(fileList).find(
      (item) => item.type.startsWith("image/") || isAllowedProductImageFile(item),
    );
    if (!file) {
      toast.error("Επιλέξτε αρχείο εικόνας.");
      return;
    }
    void uploadFile(file);
  }

  const isDisabled = disabled || uploading;

  if (displayUrl) {
    return (
      <div className={cn("flex items-start gap-4", compact && "gap-3")}>
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50 shadow-sm",
            compact ? "size-20" : "size-28",
          )}
        >
          <Image
            src={displayUrl}
            alt=""
            fill
            className="object-cover"
            sizes={compact ? "80px" : "112px"}
            unoptimized
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-gold-600" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
          <p className="text-xs font-medium text-gray-500">
            {entityType === "category" ? "Εικόνα κατηγορίας" : "Εικόνα υποκατηγορίας"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn(!isDisabled && "cursor-pointer")}>
              <span
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-navy-900/10 bg-white px-3 text-xs font-semibold text-navy-900 shadow-sm transition-colors hover:bg-gray-50",
                  isDisabled && "pointer-events-none opacity-60",
                )}
              >
                <Upload className="size-3.5" />
                Αλλαγή Εικόνας
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isDisabled}
                onChange={(event) => {
                  if (event.target.files?.length) {
                    handleFiles(event.target.files);
                  }
                  event.target.value = "";
                }}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isDisabled}
              onClick={() => void handleRemove()}
            >
              <X className="size-3.5" />
              Αφαίρεση
            </Button>
          </div>
          {!entityId && pendingFile ? (
            <p className="text-[11px] text-gold-600">
              Θα ανέβει μετά την αποθήκευση της κατηγορίας.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!isDisabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        if (isDisabled) return;
        if (event.dataTransfer.files?.length) {
          handleFiles(event.dataTransfer.files);
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition-colors",
        compact ? "py-6" : "py-8",
        dragOver
          ? "border-gold-500 bg-gold-500/5"
          : "border-gray-200 bg-gray-50/50",
        isDisabled && "pointer-events-none opacity-60",
      )}
    >
      {uploading ? (
        <Loader2 className="mb-2 size-7 animate-spin text-gold-600" />
      ) : (
        <Upload className="mb-2 size-7 text-gray-400" aria-hidden />
      )}
      <p className="text-sm font-medium text-navy-900">
        Σύρετε εικόνα εδώ ή επιλέξτε αρχείο
      </p>
      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP · συμπίεση αυτόματα</p>
      <label className={cn("mt-3", !isDisabled && "cursor-pointer")}>
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-navy-900 shadow-sm hover:bg-gray-50">
          <ImageIcon className="size-3.5" />
          Επιλογή αρχείου
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isDisabled}
          onChange={(event) => {
            if (event.target.files?.length) {
              handleFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </label>
      {!entityId ? (
        <p className="mt-2 text-[11px] text-gray-400">
          Η εικόνα θα ανέβει μετά την αποθήκευση.
        </p>
      ) : null}
    </div>
  );
}

export async function uploadPendingCatalogImage(
  entityType: CatalogImageEntity,
  entityId: string,
  file: File,
): Promise<string | null> {
  const response = await postWebsiteImageUpload(
    file,
    imageApiPath(entityType, entityId),
  );
  const payload = await readUploadJsonResponse<{ imageUrl?: string; error?: string }>(
    response,
  );

  if (!response.ok || !payload.imageUrl) {
    throw new Error(payload.error ?? mapUploadStatusToGreekError(response.status));
  }

  return payload.imageUrl;
}
