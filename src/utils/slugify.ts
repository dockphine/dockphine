export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug variant safe as a Postgres/MySQL identifier (underscores, no leading digit). */
export function toDbIdentifier(input: string): string {
  const slug = slugify(input).replace(/-/g, "_");
  return /^[0-9]/.test(slug) ? `db_${slug}` : slug;
}
