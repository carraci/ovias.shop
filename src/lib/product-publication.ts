/** A saved publication date is enforced on storefront reads. Invalid dates stay hidden. */
export function publicationDateReached(
  publishAt: string | null | undefined,
  now = Date.now(),
) {
  if (!publishAt) return true;
  const timestamp = Date.parse(publishAt);
  return Number.isFinite(timestamp) && timestamp <= now;
}
