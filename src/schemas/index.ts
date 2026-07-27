import { z } from "zod";
const text = (max = 200) => z.string().trim().min(1).max(max);
const optionalText = (max = 200) => z.string().trim().max(max).optional().nullable();
const url = z.string().url().optional().nullable();
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const id = z.string().uuid();
export const serviceInput = z.object({ body: z.object({
  title: text(), slug: slug.optional(), shortDescription: text(500), description: text(50000), icon: optionalText(),
  tagline: optionalText(300), category: optionalText(), imageUrl: url, heroImageUrl: url,
  features: z.array(text(200)).max(50).default([]), benefits: z.array(text(300)).max(50).default([]),
  deliverables: z.array(text(300)).max(50).default([]), technologies: z.array(text()).max(100).default([]),
  process: z.array(z.object({ step:z.number().int().min(1), title:text(), description:text(1000), duration:optionalText() })).max(20).optional(),
  faqs: z.array(z.object({ question:text(500), answer:text(5000) })).max(50).optional(),
  startingPrice: optionalText(), estimatedTimeline: optionalText(), order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(), seoTitle: optionalText(), seoDescription: optionalText(500)
}) });
export const projectInput = z.object({ body: z.object({
  title: text(), slug: slug.optional(), clientName: optionalText(), summary: text(1000), content: text(100000),
  kind: z.enum(["WEBSITE","WEB_APP","MOBILE_APP","DESKTOP_APP","PLATFORM","CASE_STUDY"]).optional(),
  coverImageUrl: url, galleryImages: z.array(z.string().url()).max(30).default([]), screenshots:z.array(z.string().url()).max(50).default([]), serviceIds: z.array(id).max(50).default([]),
  technologies: z.array(text()).max(50).default([]), platforms:z.array(text()).max(20).default([]), features:z.array(text(300)).max(100).default([]),
  projectUrl: url, playStoreUrl:url, appStoreUrl:url, results:z.array(z.object({label:text(),value:text(),description:optionalText(500)})).max(30).optional(),
  completionDate: z.coerce.date().optional().nullable(),
  order: z.number().int().min(0).optional(), status: z.enum(["DRAFT","PUBLISHED","ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(), seoTitle: optionalText(), seoDescription: optionalText(500)
}) });
export const enquiryInput = z.object({ body: z.object({
  name: text(), email: z.string().email().max(320), phone: optionalText(30), company: optionalText(),
  subject: text(200), message: text(10000), website: z.string().max(0).optional()
}) });
export const requestInput = z.object({ body: z.object({
  name: text(), email: z.string().email().max(320), phone: optionalText(30), company: optionalText(),
  serviceIds: z.array(id).min(1).max(20), projectType: optionalText(), projectSummary: text(20000),
  goals:z.array(text(500)).min(1).max(20), targetAudience:text(2000), requiredFeatures:z.array(text(500)).max(50).default([]),
  preferredPlatforms:z.array(text()).max(20).default([]), inspirationUrls:z.array(z.string().url()).max(20).default([]),
  budgetRange: optionalText(), budgetMin:z.number().int().min(0).optional(), budgetMax:z.number().int().min(0).optional(),
  budgetCurrency:z.string().length(3).toUpperCase().default("USD"), desiredStartDate: z.coerce.date().optional().nullable(), timeline: optionalText(),
  attachmentUrl: url, attachmentUrls:z.array(z.string().url()).max(10).default([]),
  contactPreference:z.enum(["EMAIL","PHONE","WHATSAPP","VIDEO_CALL"]).default("EMAIL"),
  discoveryAnswers:z.record(z.union([z.string().max(5000),z.array(z.string().max(1000)),z.boolean(),z.number()])).optional(),
  consentToContact:z.literal(true), source:optionalText(), website: z.string().max(0).optional()
}).superRefine((data,ctx)=>{if(data.budgetMin!==undefined&&data.budgetMax!==undefined&&data.budgetMin>data.budgetMax)ctx.addIssue({code:"custom",path:["budgetMax"],message:"Maximum budget must be greater than or equal to minimum budget."})}) });
export const reorderInput = z.object({ body: z.object({ ids: z.array(id).min(1) }) });
