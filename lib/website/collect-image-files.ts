import { isAllowedProductImageFile } from "@/lib/website/product-image-upload";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || isAllowedProductImageFile(file);
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/** Collect image files from a picker, array, or drag-and-drop DataTransfer. */
export function collectImageFiles(source: FileList | File[] | DataTransfer): File[] {
  const seen = new Set<string>();
  const files: File[] = [];

  function add(file: File | null) {
    if (!file || !isImageFile(file)) return;

    const key = fileKey(file);
    if (seen.has(key)) return;

    seen.add(key);
    files.push(file);
  }

  if (typeof DataTransfer !== "undefined" && source instanceof DataTransfer) {
    if (source.items?.length) {
      for (const item of Array.from(source.items)) {
        if (item.kind === "file") {
          add(item.getAsFile());
        }
      }
    }

    if (files.length === 0 && source.files?.length) {
      for (const file of Array.from(source.files)) {
        add(file);
      }
    }

    return files;
  }

  for (const file of Array.from(source as FileList | File[])) {
    add(file);
  }

  return files;
}
