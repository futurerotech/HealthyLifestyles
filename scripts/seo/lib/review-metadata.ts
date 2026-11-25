/** Review claims must describe a real review, never a required fabricated default.
 * https://schema.org/reviewedBy and https://schema.org/lastReviewed
 */
export function reviewMetadataIssues(value: Record<string, any>): string[] {
  const issues: string[] = [];
  if (value.reviewedBy !== undefined) {
    const reviewers = Array.isArray(value.reviewedBy) ? value.reviewedBy : [value.reviewedBy];
    if (!reviewers.length || reviewers.some((r) => !r || typeof r !== 'object' || !String(r.name || r['@id'] || '').trim())) issues.push('reviewedBy must identify a real person or organization.');
    // A page cannot claim independent review by its own author (ported from PR #64).
    const author = value.author && typeof value.author === 'object' ? value.author : undefined;
    const same = (r: any) => !!author && !!r && typeof r === 'object' &&
      ((typeof r['@id'] === 'string' && r['@id'].trim() !== '' && r['@id'] === author['@id']) ||
       (typeof r.name === 'string' && r.name.trim() !== '' && r.name.trim() === String(author.name ?? '').trim()));
    if (reviewers.some(same)) issues.push('reviewedBy must not be the same person as the author.');
  }
  if (value.lastReviewed !== undefined) {
    if (!value.reviewedBy) issues.push('lastReviewed requires an identified reviewer.');
    if (typeof value.lastReviewed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.lastReviewed) || !Number.isFinite(Date.parse(value.lastReviewed)) || new Date(value.lastReviewed).toISOString().slice(0, 10) !== value.lastReviewed || Date.parse(value.lastReviewed) > Date.now()) issues.push('lastReviewed must be a valid non-future editorial review date.');
  }
  return issues;
}
