"use client";

import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  WebsiteCategory,
  WebsiteSubcategory,
} from "@/lib/website/types";
import { premiumGoldButton, premiumGhostButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";

type Subcategory = WebsiteSubcategory;

type Category = WebsiteCategory & {
  website_subcategories: Subcategory[];
};

type CategoryFormData = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
};

type SubcategoryFormData = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
};

type DeleteTarget =
  | { type: "category"; id: string; name: string }
  | { type: "subcategory"; id: string; name: string };

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
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

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

  async function saveCategory(data: CategoryFormData) {
    const slug = slugify(data.name);
    const supabase = createClient();
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || null,
      image_url: data.image_url.trim() || null,
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
      const { error: insertError } = await supabase
        .from("website_categories")
        .insert({
          ...payload,
          sort_order: categories.length + 1,
        });

      if (insertError) {
        toast.error(insertError.message);
        return;
      }
      toast.success("Κατηγορία δημιουργήθηκε");
    }

    setEditingCat(null);
    setShowNewCat(false);
    void load();
  }

  async function saveSubcategory(data: SubcategoryFormData) {
    const slug = slugify(data.name);
    const supabase = createClient();
    const payload = {
      category_id: data.category_id,
      name: data.name.trim(),
      description: data.description.trim() || null,
      image_url: data.image_url.trim() || null,
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
      const { error: insertError } = await supabase
        .from("website_subcategories")
        .insert({
          ...payload,
          sort_order: 99,
        });

      if (insertError) {
        toast.error(insertError.message);
        return;
      }
      toast.success("Υποκατηγορία δημιουργήθηκε");
    }

    setEditingSub(null);
    setShowNewSub(null);
    void load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Κατηγορίες Website"
        subtitle="Διαχείριση κατηγοριών & υποκατηγοριών προϊόντων"
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
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {showNewCat ? (
            <Card className="border-gray-200/80 shadow-card">
              <CardContent className="p-4">
                <CategoryForm
                  onSave={saveCategory}
                  onCancel={() => setShowNewCat(false)}
                />
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="overflow-hidden border-gray-200/80 shadow-card"
              >
                <div className="flex items-center gap-3 p-4">
                  <GripVertical
                    size={16}
                    className="shrink-0 cursor-grab text-gray-300"
                  />

                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {cat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">
                        {cat.name}
                      </span>
                      {!cat.is_active ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          Ανενεργό
                        </span>
                      ) : null}
                    </div>
                    {cat.description ? (
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {cat.website_subcategories.filter((s) => s.is_active).length}{" "}
                      ενεργές υποκατηγορίες
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={premiumGhostButton}
                      title="Υποκατηγορίες"
                      onClick={() =>
                        setExpanded((prev) =>
                          prev.includes(cat.id)
                            ? prev.filter((id) => id !== cat.id)
                            : [...prev, cat.id],
                        )
                      }
                    >
                      {expanded.includes(cat.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={premiumGhostButton}
                      title="Επεξεργασία"
                      onClick={() => {
                        setEditingCat(cat);
                        setShowNewCat(false);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={premiumGhostButton}
                      title={cat.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
                      onClick={() => void toggleCategory(cat.id, cat.is_active)}
                    >
                      {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:bg-red-50 hover:text-red-500"
                      title="Διαγραφή"
                      onClick={() =>
                        setDeleteTarget({
                          type: "category",
                          id: cat.id,
                          name: cat.name,
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {editingCat?.id === cat.id ? (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-4">
                    <CategoryForm
                      initial={cat}
                      onSave={saveCategory}
                      onCancel={() => setEditingCat(null)}
                    />
                  </div>
                ) : null}

                {expanded.includes(cat.id) ? (
                  <div className="border-t border-gray-100">
                    {cat.website_subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 border-b border-gray-100/80 px-4 py-3 last:border-0 hover:bg-gray-50/60"
                      >
                        <div className="w-4 shrink-0" />
                        <GripVertical
                          size={14}
                          className="shrink-0 cursor-grab text-gray-300"
                        />

                        <div className="size-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {sub.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sub.image_url}
                              alt={sub.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ImageIcon size={14} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-navy-900">
                              {sub.name}
                            </span>
                            {!sub.is_active ? (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                Ανενεργό
                              </span>
                            ) : null}
                          </div>
                          {sub.description ? (
                            <p className="text-xs text-gray-500">
                              {sub.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={premiumGhostButton}
                            onClick={() =>
                              setEditingSub({ ...sub, category_id: cat.id })
                            }
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={premiumGhostButton}
                            onClick={() =>
                              void toggleSubcategory(sub.id, sub.is_active)
                            }
                          >
                            {sub.is_active ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:bg-red-50 hover:text-red-500"
                            onClick={() =>
                              setDeleteTarget({
                                type: "subcategory",
                                id: sub.id,
                                name: sub.name,
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {editingSub?.category_id === cat.id ? (
                      <div className="border-t border-gray-100 bg-gray-50/60 p-4">
                        <SubcategoryForm
                          initial={editingSub}
                          categoryId={cat.id}
                          onSave={saveSubcategory}
                          onCancel={() => setEditingSub(null)}
                        />
                      </div>
                    ) : null}

                    {showNewSub === cat.id ? (
                      <div className="border-t border-gray-100 bg-gray-50/60 p-4">
                        <SubcategoryForm
                          categoryId={cat.id}
                          onSave={saveSubcategory}
                          onCancel={() => setShowNewSub(null)}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewSub(cat.id)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-gold-500 transition-colors hover:bg-gold-500/5"
                      >
                        <Plus size={14} />
                        Νέα Υποκατηγορία
                      </button>
                    )}
                  </div>
                ) : null}
              </Card>
            ))}

            {categories.length === 0 ? (
              <Card className="border-gray-200/80 shadow-card">
                <CardContent className="p-8 text-center text-sm text-gray-500">
                  Δεν υπάρχουν κατηγορίες. Προσθέστε την πρώτη σας κατηγορία.
                </CardContent>
              </Card>
            ) : null}
          </div>
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
  onSave: (data: CategoryFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cat-name">Όνομα *</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="π.χ. Πετσέτες"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-desc">Περιγραφή</Label>
          <Input
            id="cat-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="π.χ. Μπάνιου, πισίνας & χεριών"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-image">URL Εικόνας</Label>
        <Input
          id="cat-image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://..."
        />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="mt-2 h-20 w-32 rounded-lg border border-gray-200 object-cover"
          />
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={premiumGoldButton}
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              id: initial?.id,
              name,
              description,
              image_url: imageUrl,
            })
          }
        >
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
  onSave: (data: SubcategoryFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sub-name">Όνομα *</Label>
          <Input
            id="sub-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="π.χ. Μπάνιου"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-desc">Περιγραφή</Label>
          <Input
            id="sub-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="π.χ. Πετσέτες μπάνιου"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sub-image">URL Εικόνας</Label>
        <Input
          id="sub-image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://..."
        />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="mt-2 h-20 w-32 rounded-lg border border-gray-200 object-cover"
          />
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Ακύρωση
        </Button>
        <Button
          type="button"
          className={premiumGoldButton}
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              id: initial?.id,
              category_id: categoryId,
              name,
              description,
              image_url: imageUrl,
            })
          }
        >
          Αποθήκευση
        </Button>
      </div>
    </div>
  );
}
