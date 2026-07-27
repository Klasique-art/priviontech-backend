import argon2 from "argon2";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { env } from "@/config/env";
import { requireAdmin, requireAuth } from "@/middleware/auth";
import { deleteMedia, uploadMedia } from "@/modules/media/cloudinary";
import { openapi } from "@/openapi";
import { enquiryInput, id, projectInput, reorderInput, requestInput, serviceInput, slug, } from "@/schemas";
import { AppError, asyncHandler, errorHandler, ok, validate } from "@/utils/http";
import { uniqueSlug } from "@/utils/slug";

const router = express.Router();
const formsLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false });
const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(12) });
const projectInclude = { services: { include: { service: true } } } as const;
const normalizeProject = (p: any) => ({ ...p, services: p.services.map((x: any) => x.service) });
const param = (req: express.Request, name: string) => String(req.params[name]);
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf"]);
    if (!allowed.has(file.mimetype)) {
      callback(new AppError(422, "INVALID_FILE_TYPE", "Upload a JPG, PNG, WebP, GIF, SVG, or PDF file."));
      return;
    }
    callback(null, true);
  },
});

router.get("/health", asyncHandler(async (_req, res) => {
  let database = "up";
  try { await prisma.$queryRaw`SELECT 1`; } catch { database = "down"; }
  return ok(res, { status: database === "up" ? "ok" : "degraded", database, timestamp: new Date().toISOString() }, undefined, database === "up" ? 200 : 503);
}));
router.get("/services", asyncHandler(async (req, res) => {
  const { page, limit } = pageSchema.parse(req.query);
  const query = z.object({
    search:z.string().trim().max(200).optional(), category:z.string().trim().max(100).optional(),
    technology:z.string().trim().max(100).optional(), sort:z.enum(["order","title","newest","oldest"]).default("order"),
  }).parse(req.query);
  const where = { isActive:true, isArchived:false,
    ...(query.search ? { OR:[
      {title:{contains:query.search,mode:"insensitive" as const}},
      {shortDescription:{contains:query.search,mode:"insensitive" as const}},
      {description:{contains:query.search,mode:"insensitive" as const}},
    ]}:{ }), ...(query.category?{category:{equals:query.category,mode:"insensitive" as const}}:{}),
    ...(query.technology?{technologies:{has:query.technology}}:{}) };
  const orderBy = query.sort==="title"?{title:"asc" as const}:query.sort==="newest"?{createdAt:"desc" as const}:query.sort==="oldest"?{createdAt:"asc" as const}:{order:"asc" as const};
  const [data,total]=await prisma.$transaction([
    prisma.service.findMany({where,orderBy,skip:(page-1)*limit,take:limit,select:{
      id:true,title:true,slug:true,tagline:true,category:true,shortDescription:true,icon:true,imageUrl:true,heroImageUrl:true,
      features:true,benefits:true,technologies:true,startingPrice:true,estimatedTimeline:true,order:true,updatedAt:true,
    }}),prisma.service.count({where})
  ]);
  return ok(res,data,{page,limit,total,totalPages:Math.ceil(total/limit)});
}));
router.get("/services/:slug", validate(z.object({ params: z.object({ slug }) })), asyncHandler(async (req, res) => {
  const service = await prisma.service.findFirst({ where: { slug: param(req, "slug"), isActive: true, isArchived: false } });
  if (!service) throw new AppError(404, "NOT_FOUND", "Service not found.");
  return ok(res, service);
}));
async function listProjects(req:express.Request,res:express.Response) {
  const { page, limit } = pageSchema.parse(req.query);
  const q = z.object({ service: z.string().optional(), technology: z.string().optional(), platform:z.string().optional(),
    kind:z.enum(["WEBSITE","WEB_APP","MOBILE_APP","DESKTOP_APP","PLATFORM","CASE_STUDY"]).optional(),
    search:z.string().trim().max(200).optional(), featured: z.enum(["true","false"]).optional(),
    sort:z.enum(["order","newest","oldest","title"]).default("order") }).parse(req.query);
  const where = { status: "PUBLISHED" as const, ...(q.service ? { services: { some: { service: { slug: q.service } } } } : {}),
    ...(q.technology ? { technologies: { has: q.technology } } : {}), ...(q.platform?{platforms:{has:q.platform}}:{}),
    ...(q.kind?{kind:q.kind}:{}),
    ...(q.search?{OR:[{title:{contains:q.search,mode:"insensitive" as const}},{summary:{contains:q.search,mode:"insensitive" as const}},{content:{contains:q.search,mode:"insensitive" as const}}]}:{}),
    ...(q.featured ? { isFeatured: q.featured === "true" } : {}) };
  const orderBy = q.sort==="newest"?[{publishedAt:"desc" as const}]:q.sort==="oldest"?[{publishedAt:"asc" as const}]:q.sort==="title"?[{title:"asc" as const}]:[{order:"asc" as const},{publishedAt:"desc" as const}];
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({ where, include: projectInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.project.count({ where })
  ]);
  return ok(res, items.map(normalizeProject), { page, limit, total, totalPages: Math.ceil(total / limit) });
}
router.get("/projects", asyncHandler(async (req,res)=>listProjects(req,res)));
router.get("/projects/:slug", validate(z.object({ params: z.object({ slug }) })), asyncHandler(async (req, res) => {
  const item = await prisma.project.findFirst({ where: { slug: param(req, "slug"), status: "PUBLISHED" }, include: projectInclude });
  if (!item) throw new AppError(404, "NOT_FOUND", "Project not found.");
  return ok(res, normalizeProject(item));
}));
router.post("/enquiries", formsLimiter, validate(enquiryInput), asyncHandler(async (req, res) => {
  const { website: _, ...data } = req.body;
  return ok(res, await prisma.enquiry.create({ data, select: { id: true, createdAt: true } }), undefined, 201);
}));
router.post("/project-requests", formsLimiter, validate(requestInput), asyncHandler(async (req, res) => {
  const { serviceIds, website: _, ...data } = req.body;
  const active = await prisma.service.count({ where: { id: { in: serviceIds }, isActive: true, isArchived: false } });
  if (active !== new Set(serviceIds).size) throw new AppError(422, "INVALID_SERVICES", "Every selected service must exist and be active.", { serviceIds: "Select active services only." });
  const item = await prisma.projectRequest.create({ data: { ...data, services: { create: [...new Set<string>(serviceIds)].map((serviceId) => ({ serviceId })) } }, select: { id: true, createdAt: true } });
  return ok(res, item, undefined, 201);
}));
router.post("/service-requests", formsLimiter, validate(requestInput), asyncHandler(async (req,res)=>{
  const {serviceIds,website:_,...data}=req.body;
  const unique=[...new Set<string>(serviceIds)];
  const active=await prisma.service.count({where:{id:{in:unique},isActive:true,isArchived:false}});
  if(active!==unique.length)throw new AppError(422,"INVALID_SERVICES","Every selected service must exist and be active.",{serviceIds:"Select active services only."});
  const item=await prisma.projectRequest.create({data:{...data,services:{create:unique.map(serviceId=>({serviceId}))}},select:{id:true,status:true,createdAt:true}});
  return ok(res,{...item,nextSteps:[{step:1,title:"Review",description:"Our team reviews your brief."},{step:2,title:"Discovery",description:"We arrange a discovery call using your preferred contact method."},{step:3,title:"Proposal",description:"You receive scope, milestones, timing and pricing."}]},undefined,201);
}));
router.get("/settings", asyncHandler(async (_req, res) => ok(res, await prisma.siteSettings.findUnique({ where: { id: 1 }, select: {
  companyName: true, contactEmail: true, contactPhone: true, address: true, linkedInUrl: true, defaultSeoTitle: true, defaultSeoDescription: true, updatedAt: true
} }))));

router.post("/admin/auth/login", loginLimiter, validate(z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) })), asyncHandler(async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { email: req.body.email.toLowerCase() } });
  if (!admin || !admin.isActive || !(await argon2.verify(admin.passwordHash, req.body.password)))
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const token = jwt.sign({ role: admin.role }, env.JWT_SECRET, { subject: admin.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
  res.cookie(env.COOKIE_NAME, token, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", maxAge: 8 * 60 * 60_000, path: "/" });
  return ok(res, { id: admin.id, name: admin.name, email: admin.email, role: admin.role });
}));
router.post("/admin/auth/logout", (_req, res) => { res.clearCookie(env.COOKIE_NAME, { path: "/" }); return ok(res, null); });
router.get("/admin/auth/me", requireAuth, asyncHandler(async (req, res) => ok(res, await prisma.admin.findUnique({ where: { id: req.admin!.id }, select: { id: true, name: true, email: true, role: true, lastLoginAt: true } }))));
router.post("/admin/auth/change-password", requireAuth, validate(z.object({ body: z.object({ currentPassword: z.string(), newPassword: z.string().min(12).max(200) }) })), asyncHandler(async (req, res) => {
  const admin = await prisma.admin.findUniqueOrThrow({ where: { id: req.admin!.id } });
  if (!(await argon2.verify(admin.passwordHash, req.body.currentPassword))) throw new AppError(422, "INVALID_PASSWORD", "Current password is incorrect.");
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await argon2.hash(req.body.newPassword) } });
  return ok(res, null);
}));

router.use("/admin", requireAuth);
router.post("/admin/media/upload", mediaUpload.single("file"), asyncHandler(async(req,res)=>{
  if(!req.file)throw new AppError(422,"FILE_REQUIRED","Attach one file using the multipart field named 'file'.");
  const resourceType=req.file.mimetype==="application/pdf"?"raw":"image";
  const result=await uploadMedia(req.file.buffer,{originalName:req.file.originalname,resourceType});
  return ok(res,{publicId:result.public_id,url:result.secure_url,resourceType:result.resource_type,format:result.format,width:result.width??null,height:result.height??null,bytes:result.bytes,originalFilename:result.original_filename,createdAt:result.created_at},undefined,201);
}));
router.delete("/admin/media/:publicId", requireAdmin, asyncHandler(async(req,res)=>{
  const body=z.object({resourceType:z.enum(["image","raw","video"]).default("image")}).parse(req.body??{});
  return ok(res,{result:await deleteMedia(decodeURIComponent(param(req,"publicId")),body.resourceType)});
}));
router.get("/admin/dashboard", asyncHandler(async (_req, res) => {
  const [activeServices, publishedProjects, draftProjects, newEnquiries, newProjectRequests] = await prisma.$transaction([
    prisma.service.count({ where: { isActive: true, isArchived: false } }), prisma.project.count({ where: { status: "PUBLISHED" } }),
    prisma.project.count({ where: { status: "DRAFT" } }), prisma.enquiry.count({ where: { status: "NEW" } }), prisma.projectRequest.count({ where: { status: "NEW" } })
  ]);
  return ok(res, { activeServices, publishedProjects, draftProjects, newEnquiries, newProjectRequests });
}));
router.get("/admin/services", asyncHandler(async (_req, res) => ok(res, await prisma.service.findMany({ orderBy: { order: "asc" } }))));
router.post("/admin/services/reorder", validate(reorderInput), asyncHandler(async (req, res) => {
  const unique = [...new Set<string>(req.body.ids)];
  if (unique.length !== req.body.ids.length || await prisma.service.count({ where: { id: { in: unique } } }) !== unique.length) throw new AppError(422, "INVALID_ORDER", "IDs must be unique existing services.");
  await prisma.$transaction(unique.map((serviceId, order) => prisma.service.update({ where: { id: serviceId }, data: { order } })));
  return ok(res, null);
}));
router.post("/admin/services", validate(serviceInput), asyncHandler(async (req, res) => {
  const data = req.body; const generated = await uniqueSlug("service", data.slug ?? data.title);
  return ok(res, await prisma.service.create({ data: { ...data, slug: generated } }), undefined, 201);
}));
router.get("/admin/services/:id", validate(z.object({ params: z.object({ id }) })), asyncHandler(async (req, res) => {
  const item = await prisma.service.findUnique({ where: { id: param(req, "id") } }); if (!item) throw new AppError(404, "NOT_FOUND", "Service not found."); return ok(res, item);
}));
router.patch("/admin/services/:id", validate(z.object({ params: z.object({ id }), body: serviceInput.shape.body.partial() })), asyncHandler(async (req, res) => {
  const data = req.body; if (data.slug || data.title) data.slug = await uniqueSlug("service", data.slug ?? data.title, String(req.params.id));
  return ok(res, await prisma.service.update({ where: { id: param(req, "id") }, data }));
}));
router.post("/admin/services/:id/archive", asyncHandler(async (req, res) => ok(res, await prisma.service.update({ where: { id: param(req, "id") }, data: { isArchived: true, isActive: false } }))));
router.post("/admin/services/:id/restore", asyncHandler(async (req, res) => ok(res, await prisma.service.update({ where: { id: param(req, "id") }, data: { isArchived: false } }))));
router.delete("/admin/services/:id/permanent", requireAdmin, asyncHandler(async (req, res) => {
  const serviceId = param(req, "id");
  const references = await prisma.service.findUnique({ where: { id: serviceId }, select: { _count: { select: { projects: true, requests: true } } } });
  if (!references) throw new AppError(404, "NOT_FOUND", "Service not found.");
  if (references._count.projects + references._count.requests > 0 && req.query.confirm !== "true") throw new AppError(409, "REFERENCED", "Service is referenced. Repeat with ?confirm=true to permanently delete.");
  await prisma.$transaction([prisma.projectService.deleteMany({ where: { serviceId } }), prisma.projectRequestService.deleteMany({ where: { serviceId } }), prisma.service.delete({ where: { id: serviceId } })]);
  return ok(res, null);
}));

router.get("/admin/projects", asyncHandler(async (req, res) => {
  const status = z.enum(["DRAFT","PUBLISHED","ARCHIVED"]).optional().parse(req.query.status);
  return ok(res, (await prisma.project.findMany({ where: status ? { status } : {}, include: projectInclude, orderBy: { order: "asc" } })).map(normalizeProject));
}));
router.post("/admin/projects/reorder", validate(reorderInput), asyncHandler(async (req, res) => {
  const ids = [...new Set<string>(req.body.ids)]; if (ids.length !== req.body.ids.length || await prisma.project.count({ where: { id: { in: ids } } }) !== ids.length) throw new AppError(422, "INVALID_ORDER", "IDs must be unique existing projects.");
  await prisma.$transaction(ids.map((projectId, order) => prisma.project.update({ where: { id: projectId }, data: { order } }))); return ok(res, null);
}));
router.post("/admin/projects", validate(projectInput), asyncHandler(async (req, res) => {
  const { serviceIds, ...body } = req.body; const projectSlug = await uniqueSlug("project", body.slug ?? body.title);
  const data = { ...body, slug: projectSlug, ...(body.status === "PUBLISHED" ? { publishedAt: new Date() } : {}), services: { create: serviceIds.map((serviceId: string) => ({ serviceId })) } };
  return ok(res, normalizeProject(await prisma.project.create({ data, include: projectInclude })), undefined, 201);
}));
router.get("/admin/projects/:id", asyncHandler(async (req, res) => { const item = await prisma.project.findUnique({ where: { id: param(req, "id") }, include: projectInclude }); if (!item) throw new AppError(404,"NOT_FOUND","Project not found."); return ok(res, normalizeProject(item)); }));
router.patch("/admin/projects/:id", validate(z.object({ params: z.object({ id }), body: projectInput.shape.body.partial() })), asyncHandler(async (req, res) => {
  const { serviceIds, ...body } = req.body; if (body.slug || body.title) body.slug = await uniqueSlug("project", body.slug ?? body.title, String(req.params.id));
  if (body.status === "PUBLISHED") Object.assign(body, { publishedAt: new Date() }); if (body.status === "DRAFT") Object.assign(body, { publishedAt: null });
  const item = await prisma.project.update({ where: { id: param(req, "id") }, data: { ...body, ...(serviceIds ? { services: { deleteMany: {}, create: serviceIds.map((serviceId: string) => ({ serviceId })) } } : {}) }, include: projectInclude });
  return ok(res, normalizeProject(item));
}));
router.post("/admin/projects/:id/publish", asyncHandler(async (req, res) => ok(res, await prisma.project.update({ where: { id: param(req, "id") }, data: { status: "PUBLISHED", publishedAt: new Date() } }))));
router.post("/admin/projects/:id/unpublish", asyncHandler(async (req, res) => ok(res, await prisma.project.update({ where: { id: param(req, "id") }, data: { status: "DRAFT", publishedAt: null } }))));
router.post("/admin/projects/:id/archive", asyncHandler(async (req, res) => ok(res, await prisma.project.update({ where: { id: param(req, "id") }, data: { status: "ARCHIVED" } }))));
router.post("/admin/projects/:id/restore", asyncHandler(async (req, res) => ok(res, await prisma.project.update({ where: { id: param(req, "id") }, data: { status: "DRAFT" } }))));
router.delete("/admin/projects/:id", requireAdmin, asyncHandler(async (req, res) => { await prisma.project.delete({ where: { id: param(req, "id") } }); return ok(res, null); }));

function submissionRoutes(path: "enquiries" | "project-requests") {
  const model = path === "enquiries" ? prisma.enquiry : prisma.projectRequest;
  router.get(`/admin/${path}`, asyncHandler(async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query); const search = z.string().max(200).optional().parse(req.query.search); const status = z.string().optional().parse(req.query.status);
    const where = { ...(status ? { status: status as never } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const [data, total] = await Promise.all([(model as any).findMany({ where, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit, ...(path === "project-requests" ? { include: projectInclude } : {}) }), (model as any).count({ where })]);
    return ok(res, data, { page, limit, total, totalPages: Math.ceil(total/limit) });
  }));
  router.get(`/admin/${path}/:id`, asyncHandler(async (req, res) => { const item = await (model as any).findUnique({ where: { id: param(req, "id") }, ...(path === "project-requests" ? { include: { services: { include: { service: true } } } } : {}) }); if (!item) throw new AppError(404,"NOT_FOUND","Submission not found."); return ok(res,item); }));
  router.patch(`/admin/${path}/:id`, asyncHandler(async (req, res) => ok(res, await (model as any).update({ where: { id: param(req, "id") }, data: z.object({ status: z.string().optional(), adminNotes: z.string().max(20000).nullable().optional() }).parse(req.body) }))));
  router.delete(`/admin/${path}/:id`, requireAdmin, asyncHandler(async (req, res) => { await (model as any).delete({ where: { id: param(req, "id") } }); return ok(res,null); }));
}
submissionRoutes("enquiries"); submissionRoutes("project-requests");
router.get("/admin/settings", asyncHandler(async (_req,res) => ok(res, await prisma.siteSettings.findUnique({ where: { id: 1 } }))));
router.put("/admin/settings", validate(z.object({ body: z.object({ companyName: z.string().min(1), contactEmail: z.string().email(), contactPhone: z.string().nullable().optional(), address: z.string().nullable().optional(), linkedInUrl: z.string().url().nullable().optional(), defaultSeoTitle: z.string().min(1), defaultSeoDescription: z.string().min(1) }) })), asyncHandler(async (req,res) => ok(res, await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...req.body }, update: req.body }))));

export function createApp() {
  const app = express(); app.disable("x-powered-by"); app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false })); app.use(cors({ origin: env.CORS_ORIGIN.split(",").map(x => x.trim()), credentials: true }));
  app.use(express.json({ limit: "1mb" })); app.use(express.urlencoded({ extended: false, limit: "1mb" })); app.use(cookieParser());
  app.get("/api/openapi.json", (_req,res) => res.json(openapi)); app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.use("/api/v1", rateLimit({ windowMs: 15*60_000, limit: 300, standardHeaders: true, legacyHeaders: false }), router);
  app.use("/api/v1", (_req,res) => res.status(404).json({ success:false,error:{ code:"NOT_FOUND",message:"Endpoint not found." } }));
  app.use(errorHandler); return app;
}
