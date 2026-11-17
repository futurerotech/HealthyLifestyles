/**
 * Review attribution is evidence-based, never inferred from a generic site
 * policy, an updated date, a missing relation, or a reviewer lookup fallback.
 * The CMS human-review flag is necessary but not sufficient: the editorial
 * reviewer relationship must resolve to a distinct, existing author record.
 */
/**
 * @template {{ slug: string, name: string }} A
 * @param {{ author?: string, reviewer?: string, reviewedByHuman?: boolean }} content
 * @param {readonly A[]} authors
 * @returns {A | null}
 */
export function selectDocumentedReviewer(content, authors) {
  if (content.reviewedByHuman !== true || !content.reviewer?.trim()) return null;
  const match = authors.find(a => a.slug === content.reviewer || a.name === content.reviewer);
  if (!match || !match.slug?.trim() || !match.name?.trim()) return null;
  if (content.reviewer === content.author) return null;
  const writer = authors.find(a => a.slug === content.author || a.name === content.author);
  if (writer?.slug === match.slug) return null;
  return match;
}
