import { prisma } from "@/config/db";

export const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export async function uniqueSlug(kind: "service" | "project", input: string, excludeId?: string) {
  const base = slugify(input) || "item";
  let slug = base;
  let suffix = 2;
  const model = prisma[kind] as any;
  while (await model.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }))
    slug = `${base}-${suffix++}`;
  return slug;
}
