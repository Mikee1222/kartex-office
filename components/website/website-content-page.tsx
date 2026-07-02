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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderTree,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import {
  uploadPendingCatalogImage,
  WebsiteCategoryImageUpload,
} from "@/components/website/website-category-image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  premiumCard,
  premiumFormCard,
  premiumGoldButton,
  premiumInputFocus,
  premiumLabel,
  premiumPageSubtitle,
} from "@/lib/ui/premium-styles";
import type { WebsiteCategory, WebsiteSubcategory } from "@/lib/website/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Subcategory = WebsiteSubcategory;

type Category = WebsiteCategory & {
  website_subcategories: Subcategory[];
};

type CategoryFormData = {
  id?: string;
  name: string;
  description: string;
};

type SubcategoryFormData = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
};

type DeleteTarget =
  | { type: "category"; id: string; name: string }
  | { type: "subcategory"; id: string; name: string };

const iconActionButton =
  "size-8 rounded-lg text-gray-500 transition-all duration-150 hover:bg-navy-900/5 hover:text-navy-900";

const iconDangerButton =
  "size-8 rounded-lg text-gray-500 transition-all duration-150 hover:bg-red-50 hover:text-red-600";

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "");
  return slug || `item-${Date.now()}`;
}

function sortSubcategories(subs: Subcategory[]): Subcategory[] {
  return [...subs].sort((a, b) => a.sort_order - b.sort_order);
}

function CategoryThumbnail({
  imageUrl,
  name,
  size = "md",
}: {
  imageUrl: string | null;
  name: string;
  size?: "md" | "sm";
}) {
  const dim = size === "sm" ? "size-9" : "size-14";
  const radius = size === "sm" ? "rounded-lg" : "rounded-xl";

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border border-gray-200/60 bg-gray-50 shadow-sm",
        dim,
        radius,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size === "sm" ? 36 : 56}
          height={size === "sm" ? 36 : 56}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center text-gray-300">
          <ImageIcon size={size === "sm" ? 14 : 20} />
        </div>
      )}
    </div>
  );
}

function SortableCategoryCard({
  cat,
  expanded,
  editingCat,
  editingSub,
  showNewSub,
  reordering,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onDelete,
  onSaveCategory,
  onCancelEditCategory,
  onEditSub,
  onToggleSubActive,
  onDeleteSub,
  onSaveSubcategory,
  onCancelEditSub,
  onShowNewSub,
  onCancelNewSub,
  onSubDragEnd,
}: {
  cat: Category;
  expanded: boolean;
  editingCat: Category | null;
  editingSub: (Subcategory & { category_id: string }) | null;
  showNewSub: string | null;
  reordering: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onSaveCategory: (
    data: CategoryFormData,
    pendingImage: File | null,
    imageUrl: string | null,
  ) => Promise<void>;
  onCancelEditCategory: () => void;
  onEditSub: (sub: Subcategory) => void;
  onToggleSubActive: (id: string, isActive: boolean) => void;
  onDeleteSub: (sub: Subcategory) => void;
  onSaveSubcategory: (
    data: SubcategoryFormData,
    pendingImage: File | null,
    imageUrl: string | null,
  ) => Promise<void>;
  onCancelEditSub: () => void;
  onShowNewSub: () => void;
  onCancelNewSub: () => void;
  onSubDragEnd: (categoryId: string, event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id, disabled: reordering });

  const subSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const subIds = cat.website_subcategories.map((sub) => sub.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        premiumCard,
        "overflow-hidden",
        isDragging && "z-20 shadow-lg ring-2 ring-gold-500/35",
      )}
    >
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          type="button"
          className="shrink-0 cursor-grab rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
          aria-label="Μετακίνηση κατηγορίας"
          disabled={reordering}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <CategoryThumbnail imageUrl={cat.image_url} name={cat.name} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-navy-900">
              {cat.name}
            </span>
            {!cat.is_active ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                Ανενεργό
              </span>
            ) : null}
          </div>
          {cat.description ? (
            <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
              {cat.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-gray-400">
            {cat.website_subcategories.filter((s) => s.is_active).length} ενεργές
            υποκατηγορίες
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconActionButton}
            title="Υποκατηγορίες"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconActionButton}
            title="Επεξεργασία"
            onClick={onEdit}
          >
            <Pencil size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconActionButton}
            title={cat.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
            onClick={onToggleActive}
          >
            {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconDangerButton}
            title="Διαγραφή"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {editingCat?.id === cat.id ? (
        <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-4 sm:px-5 sm:pb-5">
          <CategoryForm
            initial={cat}
            onSave={onSaveCategory}
            onCancel={onCancelEditCategory}
          />
        </div>
      ) : null}

      {expanded ? (
        <div className="border-t border-gray-100 bg-gray-50/30">
          <div className="border-l-2 border-gold-500/25 py-2 pl-4 pr-2 sm:ml-6 sm:pl-6">
            <DndContext
              sensors={subSensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => onSubDragEnd(cat.id, event)}
            >
              <SortableContext items={subIds} strategy={verticalListSortingStrategy}>
                {cat.website_subcategories.map((sub) => (
                  <SortableSubcategoryRow
                    key={sub.id}
                    sub={sub}
                    reordering={reordering}
                    onEdit={() => onEditSub(sub)}
                    onToggleActive={() => onToggleSubActive(sub.id, sub.is_active)}
                    onDelete={() => onDeleteSub(sub)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {editingSub?.category_id === cat.id ? (
              <div className="my-2 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <SubcategoryForm
                  initial={editingSub}
                  categoryId={cat.id}
                  onSave={onSaveSubcategory}
                  onCancel={onCancelEditSub}
                />
              </div>
            ) : null}

            {showNewSub === cat.id ? (
              <div className="my-2 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <SubcategoryForm
                  categoryId={cat.id}
                  onSave={onSaveSubcategory}
                  onCancel={onCancelNewSub}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onShowNewSub}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gold-600 transition-colors hover:bg-gold-500/8"
              >
                <Plus size={14} />
                Νέα Υποκατηγορία
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortableSubcategoryRow({
  sub,
  reordering,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  sub: Subcategory;
  reordering: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sub.id, disabled: reordering });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "mb-1 flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-gray-200/60 hover:bg-white/80",
        isDragging && "z-10 border-gold-500/30 bg-white shadow-md ring-1 ring-gold-500/25",
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab rounded p-0.5 text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
        aria-label="Μετακίνηση υποκατηγορίας"
        disabled={reordering}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <CategoryThumbnail imageUrl={sub.image_url} name={sub.name} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy-900">{sub.name}</span>
          {!sub.is_active ? (
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
              Ανενεργό
            </span>
          ) : null}
        </div>
        {sub.description ? (
          <p className="truncate text-xs text-gray-500">{sub.description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconActionButton, "size-7")}
          onClick={onEdit}
        >
          <Pencil size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconActionButton, "size-7")}
          onClick={onToggleActive}
        >
          {sub.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconDangerButton, "size-7")}
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

export function WebsiteContentPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [editingCat, setEditingCat] = React.useState<Category | null>(null);
  const [editingSub, setEditingSub] = React.useState<
    (Subcategory & { category_id: string }) | null
  >(null);
  const [showNewCat, setShowNewCat] = React.useState(false);
  const [showNewSub, setShowNewSub] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("website_categories")
      .select("*, website_subcategories(*)")
      .order("sort_order");

    if (fetchError) {
      setError(fetchError.message);
      setCategories([]);
    } else {
      const rows = ((data as Category[]) ?? []).map((cat) => ({
        ...cat,
        website_subcategories: sortSubcategories(cat.website_subcategories ?? []),
      }));
      setCategories(rows);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function persistCategoryReorder(orderedIds: string[]) {
    setReordering(true);
    const response = await fetch("/api/website/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    const payload = (await response.json()) as { error?: string };
    setReordering(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Αποτυχία αναδιάταξης κατηγοριών.");
      void load();
    }
  }

  async function persistSubcategoryReorder(categoryId: string, orderedIds: string[]) {
    setReordering(true);
    const response = await fetch("/api/website/subcategories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, orderedIds }),
    });
    const payload = (await response.json()) as { error?: string };
    setReordering(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Αποτυχία αναδιάταξης υποκατηγοριών.");
      void load();
    }
  }

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    void persistCategoryReorder(reordered.map((cat) => cat.id));
  }

  function handleSubcategoryDragEnd(categoryId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;

    const subs = category.website_subcategories;
    const oldIndex = subs.findIndex((sub) => sub.id === active.id);
    const newIndex = subs.findIndex((sub) => sub.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedSubs = arrayMove(subs, oldIndex, newIndex);
    setCategories((current) =>
      current.map((cat) =>
        cat.id === categoryId
          ? { ...cat, website_subcategories: reorderedSubs }
          : cat,
      ),
    );
    void persistSubcategoryReorder(
      categoryId,
      reorderedSubs.map((sub) => sub.id),
    );
  }

  async function toggleCategory(id: string, is_active: boolean) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("website_categories")
      .update({ is_active: !is_active })
      .eq("id", id);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success(
      is_active ? "Κατηγορία απενεργοποιήθηκε" : "Κατηγορία ενεργοποιήθηκε",
    );
    void load();
  }

  async function toggleSubcategory(id: string, is_active: boolean) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("website_subcategories")
      .update({ is_active: !is_active })
      .eq("id", id);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success(is_active ? "Απενεργοποιήθηκε" : "Ενεργοποιήθηκε");
    void load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const supabase = createClient();
    const table =
      deleteTarget.type === "category"
        ? "website_categories"
        : "website_subcategories";

    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", deleteTarget.id);

    setDeleting(false);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    toast.success(
      deleteTarget.type === "category"
        ? "Κατηγορία διαγράφηκε"
        : "Υποκατηγορία διαγράφηκε",
    );
    setDeleteTarget(null);
    void load();
  }

  async function saveCategory(
    data: CategoryFormData,
    pendingImage: File | null,
    _imageUrl: string | null,
  ) {
    const slug = slugify(data.name);
    const supabase = createClient();
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || null,
      slug,
    };

    if (data.id) {
      const { error: updateError } = await supabase
        .from("website_categories")
        .update(payload)
        .eq("id", data.id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }
      toast.success("Αποθηκεύτηκε");
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("website_categories")
        .insert({
          ...payload,
          sort_order: categories.length,
        })
        .select("id")
        .single();

      if (insertError) {
        toast.error(insertError.message);
        return;
      }

      if (pendingImage && inserted?.id) {
        try {
          await uploadPendingCatalogImage("category", inserted.id, pendingImage);
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error
              ? uploadError.message
              : "Η κατηγορία δημιουργήθηκε αλλά η εικόνα απέτυχε.",
          );
        }
      }

      toast.success("Κατηγορία δημιουργήθηκε");
    }

    setEditingCat(null);
    setShowNewCat(false);
    void load();
  }

  async function saveSubcategory(
    data: SubcategoryFormData,
    pendingImage: File | null,
    _imageUrl: string | null,
  ) {
    const slug = slugify(data.name);
    const supabase = createClient();
    const parent = categories.find((cat) => cat.id === data.category_id);
    const payload = {
      category_id: data.category_id,
      name: data.name.trim(),
      description: data.description.trim() || null,
      slug,
    };

    if (data.id) {
      const { error: updateError } = await supabase
        .from("website_subcategories")
        .update(payload)
        .eq("id", data.id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }
      toast.success("Αποθηκεύτηκε");
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("website_subcategories")
        .insert({
          ...payload,
          sort_order: parent?.website_subcategories.length ?? 0,
        })
        .select("id")
        .single();

      if (insertError) {
        toast.error(insertError.message);
        return;
      }

      if (pendingImage && inserted?.id) {
        try {
          await uploadPendingCatalogImage("subcategory", inserted.id, pendingImage);
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error
              ? uploadError.message
              : "Η υποκατηγορία δημιουργήθηκε αλλά η εικόνα απέτυχε.",
          );
        }
      }

      toast.success("Υποκατηγορία δημιουργήθηκε");
    }

    setEditingSub(null);
    setShowNewSub(null);
    void load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Κατηγορίες Website"
        subtitle={
          <span className={cn(premiumPageSubtitle, "inline-flex items-center gap-1.5")}>
            <FolderTree className="size-3.5 shrink-0 text-gold-500/70" aria-hidden />
            Διαχείριση κατηγοριών & υποκατηγοριών προϊόντων
          </span>
        }
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => {
              setShowNewCat(true);
              setEditingCat(null);
            }}
          >
            <Plus className="size-4" />
            Νέα Κατηγορία
          </Button>
        }
      />

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {showNewCat ? (
            <Card className={premiumFormCard}>
              <CardContent className="p-0">
                <CategoryForm
                  onSave={saveCategory}
                  onCancel={() => setShowNewCat(false)}
                />
              </CardContent>
            </Card>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={categories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {categories.map((cat) => (
                  <SortableCategoryCard
                    key={cat.id}
                    cat={cat}
                    expanded={expanded.includes(cat.id)}
                    editingCat={editingCat}
                    editingSub={editingSub}
                    showNewSub={showNewSub}
                    reordering={reordering}
                    onToggleExpand={() =>
                      setExpanded((prev) =>
                        prev.includes(cat.id)
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id],
                      )
                    }
                    onEdit={() => {
                      setEditingCat(cat);
                      setShowNewCat(false);
                    }}
                    onToggleActive={() => void toggleCategory(cat.id, cat.is_active)}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "category",
                        id: cat.id,
                        name: cat.name,
                      })
                    }
                    onSaveCategory={saveCategory}
                    onCancelEditCategory={() => setEditingCat(null)}
                    onEditSub={(sub) =>
                      setEditingSub({ ...sub, category_id: cat.id })
                    }
                    onToggleSubActive={(id, isActive) =>
                      void toggleSubcategory(id, isActive)
                    }
                    onDeleteSub={(sub) =>
                      setDeleteTarget({
                        type: "subcategory",
                        id: sub.id,
                        name: sub.name,
                      })
                    }
                    onSaveSubcategory={saveSubcategory}
                    onCancelEditSub={() => setEditingSub(null)}
                    onShowNewSub={() => setShowNewSub(cat.id)}
                    onCancelNewSub={() => setShowNewSub(null)}
                    onSubDragEnd={handleSubcategoryDragEnd}
                  />
                ))}

                {categories.length === 0 ? (
                  <Card className={premiumCard}>
                    <CardContent className="p-10 text-center">
                      <FolderTree className="mx-auto mb-3 size-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Δεν υπάρχουν κατηγορίες. Προσθέστε την πρώτη σας κατηγορία.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!deleting && !open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === "category"
            ? "Διαγραφή κατηγορίας"
            : "Διαγραφή υποκατηγορίας"
        }
        className="max-w-lg"
      >
        <DialogBody className="text-sm text-foreground">
          <p>
            {deleteTarget?.type === "category" ? (
              <>
                Θέλετε σίγουρα να διαγράψετε την κατηγορία{" "}
                <strong>{deleteTarget.name}</strong>; Θα διαγραφούν και όλες οι
                υποκατηγορίες της.
              </>
            ) : (
              <>
                Θέλετε σίγουρα να διαγράψετε την υποκατηγορία{" "}
                <strong>{deleteTarget?.name}</strong>;
              </>
            )}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Ακύρωση
          </Button>
          <Button
            type="button"
            disabled={deleting}
            onClick={() => void confirmDelete()}
          >
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Διαγραφή…
              </>
            ) : (
              "Διαγραφή"
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>;
  onSave: (
    data: CategoryFormData,
    pendingImage: File | null,
    imageUrl: string | null,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? null);
  const [pendingImage, setPendingImage] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cat-name" className={premiumLabel}>
            Όνομα *
          </Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="π.χ. Πετσέτες"
            className={premiumInputFocus}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-desc" className={premiumLabel}>
            Περιγραφή
          </Label>
          <Input
            id="cat-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="π.χ. Μπάνιου, πισίνας & χεριών"
            className={premiumInputFocus}
          />
        </div>
      </div>

      <WebsiteCategoryImageUpload
        entityType="category"
        entityId={initial?.id}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        pendingFile={pendingImage}
        onPendingFileChange={setPendingImage}
        disabled={saving}
      />

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={premiumGoldButton}
          disabled={!name.trim() || saving}
          onClick={() => {
            setSaving(true);
            void onSave(
              {
                id: initial?.id,
                name,
                description,
              },
              pendingImage,
              imageUrl,
            ).finally(() => setSaving(false));
          }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Αποθήκευση
        </Button>
      </div>
    </div>
  );
}

function SubcategoryForm({
  initial,
  categoryId,
  onSave,
  onCancel,
}: {
  initial?: Partial<Subcategory>;
  categoryId: string;
  onSave: (
    data: SubcategoryFormData,
    pendingImage: File | null,
    imageUrl: string | null,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? null);
  const [pendingImage, setPendingImage] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sub-name" className={premiumLabel}>
            Όνομα *
          </Label>
          <Input
            id="sub-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="π.χ. Μπάνιου"
            className={premiumInputFocus}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-desc" className={premiumLabel}>
            Περιγραφή
          </Label>
          <Input
            id="sub-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="π.χ. Πετσέτες μπάνιου"
            className={premiumInputFocus}
          />
        </div>
      </div>

      <WebsiteCategoryImageUpload
        entityType="subcategory"
        entityId={initial?.id}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        pendingFile={pendingImage}
        onPendingFileChange={setPendingImage}
        disabled={saving}
        compact
      />

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={premiumGoldButton}
          disabled={!name.trim() || saving}
          onClick={() => {
            setSaving(true);
            void onSave(
              {
                id: initial?.id,
                category_id: categoryId,
                name,
                description,
              },
              pendingImage,
              imageUrl,
            ).finally(() => setSaving(false));
          }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Αποθήκευση
        </Button>
      </div>
    </div>
  );
}
