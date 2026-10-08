/** Resolve an explicit CMS reviewer assignment, never a site-wide fallback.
 * A profile is attribution, not independent verification of a professional license.
 * The publisher must verify credentials and the completed review before assignment.
 * `reviewedByHuman` only acknowledges an AI draft and is NOT clinical sign-off.
 */
export function assignedReviewer<T extends { slug: string; name: string; schemaType: string; credential?: string; bio?: string }>(
  assignment: string | undefined,
  authors: T[],
): T | undefined {
  if (!assignment?.trim()) return undefined;
  const reviewer = authors.find((a) => a.slug === assignment || a.name === assignment);
  if (!reviewer || reviewer.schemaType !== 'Person' || !reviewer.name.trim() ||
      !reviewer.credential?.trim() || !reviewer.bio?.trim() || reviewer.slug === 'medical-review') return undefined;
  return reviewer;
}
