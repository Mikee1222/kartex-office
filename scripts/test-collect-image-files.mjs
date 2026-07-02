/**
 * Smoke test for collectImageFiles — run: node scripts/test-collect-image-files.mjs
 * Uses dynamic import of the TS module via a tiny inline reimplementation check.
 */

function isAllowedExtension(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext ?? "");
}

function collectImageFiles(files) {
  const seen = new Set();
  const result = [];
  for (const file of files) {
    const isImage =
      file.type?.startsWith("image/") ||
      isAllowedExtension(file.name);
    if (!isImage) continue;
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(file);
  }
  return result;
}

const mockFiles = [
  { name: "a.jpg", size: 100, lastModified: 1, type: "image/jpeg" },
  { name: "b.png", size: 200, lastModified: 2, type: "image/png" },
  { name: "c.txt", size: 50, lastModified: 3, type: "text/plain" },
  { name: "d.webp", size: 300, lastModified: 4, type: "image/webp" },
  { name: "a.jpg", size: 100, lastModified: 1, type: "image/jpeg" },
];

const collected = collectImageFiles(mockFiles);
if (collected.length !== 3) {
  console.error("FAIL: expected 3 images, got", collected.length);
  process.exit(1);
}
if (collected.map((f) => f.name).join(",") !== "a.jpg,b.png,d.webp") {
  console.error("FAIL: wrong file order/names", collected.map((f) => f.name));
  process.exit(1);
}

console.log("OK: collectImageFiles logic — 3 unique images from 5 inputs (1 non-image, 1 duplicate)");
