/**
 * Derives the product master clean name from category and quality grade.
 */
export function generateCleanName(category: string, qualityGrade: string): string {
  const trimmedCategory = category.trim();
  if (!trimmedCategory) {
    return "";
  }

  const trimmedGrade = qualityGrade.trim();
  if (!trimmedGrade) {
    return trimmedCategory;
  }

  if (/^\d+$/.test(trimmedGrade)) {
    return `${trimmedCategory} ${trimmedGrade}gsm`;
  }

  return `${trimmedCategory} ${trimmedGrade}`;
}
