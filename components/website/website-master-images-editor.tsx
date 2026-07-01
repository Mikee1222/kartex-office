"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductMasterImageRow } from "@/lib/website/types";
import { cn } from "@/lib/utils";

type UploadProgress = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

type WebsiteMasterImagesEditorProps = {
  masterId: string;
  cleanName: string;
  images: ProductMasterImageRow[];
  disabled?: boolean;
  onChange: (images: ProductMasterImageRow[], imageUrl: string | null) => void;
};

function SortableImageCard({
  image,
  isPrimary,
  disabled,
  onSetPrimary,
  onDelete,
  onAltTextSave,
}: {
  image: ProductMasterImageRow;
  isPrimary: boolean;
  disabled?: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
  onAltTextSave: (altText: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id, disabled });

  const [altText, setAltText] = React.useState(image.altText ?? "");
  React.useEffect(() => {
    setAltText(image.altText ?? "");
  }, [image.altText]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm",
        isDragging && "z-10 opacity-80 ring-2 ring-gold-500/40",
        isPrimary ? "border-gold-500/50" : "border-gray-200",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={image.url}
          alt={altText || image.altText || "Product image"}
          fill
          className="object-cover"
          sizes="160px"
          unoptimized
        />
        {isPrimary ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="size-3" aria-hidden />
            Κύρια
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
          aria-label="Μετακίνηση εικόνας"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        {!isPrimary ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            disabled={disabled}
            onClick={onSetPrimary}
          >
            Ορισμός ως κύρια
          </Button>
        ) : (
          <span className="flex-1 text-xs text-gray-400">Πρώτη στη σειρά</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-red-600 hover:text-red-700"
          disabled={disabled}
          onClick={onDelete}
          aria-label="Διαγραφή εικόνας"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-2">
        <Label htmlFor={`alt-${image.id}`} className="text-xs text-gray-500">
          Alt text
        </Label>
        <Input
          id={`alt-${image.id}`}
          value={altText}
          disabled={disabled}
          onChange={(event) => setAltText(event.target.value)}
          onBlur={() => {
            if (altText !== (image.altText ?? "")) {
              onAltTextSave(altText);
            }
          }}
          className="mt-1 h-8 text-xs"
          placeholder="Περιγραφή εικόνας"
        />
      </div>
    </div>
  );
}

export function WebsiteMasterImagesEditor({
  masterId,
  cleanName,
  images,
  disabled,
  onChange,
}: WebsiteMasterImagesEditorProps) {
  const [localImages, setLocalImages] = React.useState(images);
  const [uploads, setUploads] = React.useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function persistReorder(nextImages: ProductMasterImageRow[]) {
    setBusy(true);
    const response = await fetch(
      `/api/website/product-masters/${masterId}/images/reorder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: nextImages.map((img) => img.id) }),
      },
    );
    const payload = (await response.json()) as {
      master?: { images: ProductMasterImageRow[]; imageUrl: string | null };
      error?: string;
    };
    setBusy(false);

    if (!response.ok || !payload.master) {
      toast.error(payload.error ?? "Αποτυχία αναδιάταξης.");
      setLocalImages(images);
      return;
    }

    setLocalImages(payload.master.images);
    onChange(payload.master.images, payload.master.imageUrl);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localImages.findIndex((img) => img.id === active.id);
    const newIndex = localImages.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(localImages, oldIndex, newIndex).map(
      (img, index) => ({ ...img, sortOrder: index }),
    );
    setLocalImages(reordered);
    await persistReorder(reordered);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) {
      toast.error("Επιλέξτε αρχεία εικόνας.");
      return;
    }

    for (const file of files) {
      const uploadId = crypto.randomUUID();
      setUploads((current) => [
        ...current,
        { id: uploadId, name: file.name, status: "uploading" },
      ]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `/api/website/product-masters/${masterId}/images`,
          { method: "POST", body: formData },
        );
        const payload = (await response.json()) as {
          master?: { images: ProductMasterImageRow[]; imageUrl: string | null };
          error?: string;
        };

        if (!response.ok || !payload.master) {
          throw new Error(payload.error ?? "Upload failed");
        }

        setLocalImages(payload.master.images);
        onChange(payload.master.images, payload.master.imageUrl);
        setUploads((current) =>
          current.map((item) =>
            item.id === uploadId ? { ...item, status: "done" } : item,
          ),
        );
      } catch (error) {
        setUploads((current) =>
          current.map((item) =>
            item.id === uploadId
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        );
      }
    }

    window.setTimeout(() => {
      setUploads((current) => current.filter((item) => item.status === "uploading"));
    }, 4000);
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(true);
    const response = await fetch(
      `/api/website/product-masters/${masterId}/images/${imageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setPrimary: true }),
      },
    );
    const payload = (await response.json()) as {
      master?: { images: ProductMasterImageRow[]; imageUrl: string | null };
      error?: string;
    };
    setBusy(false);

    if (!response.ok || !payload.master) {
      toast.error(payload.error ?? "Αποτυχία ορισμού κύριας εικόνας.");
      return;
    }

    setLocalImages(payload.master.images);
    onChange(payload.master.images, payload.master.imageUrl);
    toast.success("Η κύρια εικόνα ενημερώθηκε.");
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm("Διαγραφή αυτής της εικόνας;")) return;

    setBusy(true);
    const response = await fetch(
      `/api/website/product-masters/${masterId}/images/${imageId}`,
      { method: "DELETE" },
    );
    const payload = (await response.json()) as {
      master?: { images: ProductMasterImageRow[]; imageUrl: string | null };
      error?: string;
    };
    setBusy(false);

    if (!response.ok || !payload.master) {
      toast.error(payload.error ?? "Αποτυχία διαγραφής.");
      return;
    }

    setLocalImages(payload.master.images);
    onChange(payload.master.images, payload.master.imageUrl);
    toast.success("Η εικόνα διαγράφηκε.");
  }

  async function handleAltTextSave(imageId: string, altText: string) {
    const response = await fetch(
      `/api/website/product-masters/${masterId}/images/${imageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText }),
      },
    );
    const payload = (await response.json()) as {
      image?: ProductMasterImageRow;
      error?: string;
    };

    if (!response.ok || !payload.image) {
      toast.error(payload.error ?? "Αποτυχία αποθήκευσης alt text.");
      return;
    }

    setLocalImages((current) =>
      current.map((img) => (img.id === imageId ? payload.image! : img)),
    );
  }

  const isDisabled = disabled || busy;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files?.length) {
            void uploadFiles(event.dataTransfer.files);
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-gold-500 bg-gold-500/5"
            : "border-gray-200 bg-gray-50/50",
          isDisabled && "pointer-events-none opacity-60",
        )}
      >
        <Upload className="mb-3 size-8 text-gray-400" aria-hidden />
        <p className="text-sm font-medium text-navy-900">
          Σύρετε εικόνες εδώ ή επιλέξτε αρχεία
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, WebP · πολλαπλά αρχεία · συμπίεση αυτόματα στον server
        </p>
        <label className="mt-4 cursor-pointer">
          <span className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-navy-900 hover:bg-gray-50">
            <ImageIcon className="size-4" />
            Επιλογή αρχείων
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={isDisabled}
            onChange={(event) => {
              if (event.target.files?.length) {
                void uploadFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {uploads.length > 0 ? (
        <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
          {uploads.map((upload) => (
            <li key={upload.id} className="flex items-center gap-2 text-gray-600">
              {upload.status === "uploading" ? (
                <Loader2 className="size-4 animate-spin text-gold-600" />
              ) : null}
              <span className="truncate">{upload.name}</span>
              {upload.status === "error" ? (
                <span className="text-xs text-red-600">{upload.error}</span>
              ) : null}
              {upload.status === "done" ? (
                <span className="text-xs text-green-600">OK</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {localImages.length === 0 ? (
        <p className="text-sm text-gray-500">
          Δεν υπάρχουν εικόνες για το «{cleanName}».
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext
            items={localImages.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {localImages.map((image, index) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  isPrimary={index === 0}
                  disabled={isDisabled}
                  onSetPrimary={() => void handleSetPrimary(image.id)}
                  onDelete={() => void handleDelete(image.id)}
                  onAltTextSave={(altText) =>
                    void handleAltTextSave(image.id, altText)
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
