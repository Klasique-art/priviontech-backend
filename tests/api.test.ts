import argon2 from "argon2";
import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  $queryRaw:vi.fn(),$transaction:vi.fn(async(x:any)=>Array.isArray(x)?Promise.all(x):x),
  service:{findMany:vi.fn(),findFirst:vi.fn(),count:vi.fn(),create:vi.fn(),update:vi.fn()},
  project:{findMany:vi.fn(),findFirst:vi.fn(),count:vi.fn()},
  enquiry:{create:vi.fn()},projectRequest:{create:vi.fn()},
  siteSettings:{findUnique:vi.fn()},admin:{findUnique:vi.fn(),findFirst:vi.fn(),update:vi.fn()}
};
vi.mock("@/config/db",()=>({prisma:db}));
const { createApp } = await import("@/app");
const app=createApp();
const uuid="11111111-1111-4111-8111-111111111111";
const adminCookie=`privion_admin=${jwt.sign({role:"ADMIN"},process.env.JWT_SECRET!,{subject:uuid})}`;

beforeEach(()=>{vi.clearAllMocks();db.$queryRaw.mockResolvedValue([{ "?column?":1 }]);db.$transaction.mockImplementation(async(x:any)=>Array.isArray(x)?Promise.all(x):x)});
describe("Privion API",()=>{
  it("lists services in database order and excludes inactive via query",async()=>{db.service.findMany.mockResolvedValue([{id:"a",order:0},{id:"b",order:1}]);const r=await request(app).get("/api/v1/services");expect(r.status).toBe(200);expect(r.body.data.map((x:any)=>x.id)).toEqual(["a","b"]);expect(db.service.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{isActive:true,isArchived:false},orderBy:{order:"asc"}}))});
  it("returns not found for missing service",async()=>{db.service.findFirst.mockResolvedValue(null);expect((await request(app).get("/api/v1/services/missing")).status).toBe(404)});
  it("lists published projects and excludes drafts with filters",async()=>{db.project.findMany.mockResolvedValue([]);db.project.count.mockResolvedValue(0);const r=await request(app).get("/api/v1/projects?technology=TypeScript&featured=true");expect(r.status).toBe(200);expect(db.project.findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({status:"PUBLISHED",technologies:{has:"TypeScript"},isFeatured:true})}))});
  it("validates an enquiry",async()=>{const r=await request(app).post("/api/v1/enquiries").send({name:"A",email:"bad"});expect(r.status).toBe(422);expect(r.body.error.code).toBe("VALIDATION_ERROR")});
  it("creates an enquiry",async()=>{db.enquiry.create.mockResolvedValue({id:uuid});const r=await request(app).post("/api/v1/enquiries").send({name:"Ada",email:"ada@example.com",subject:"Question",message:"Hello"});expect(r.status).toBe(201)});
  it("validates project request service ids",async()=>{const r=await request(app).post("/api/v1/project-requests").send({name:"Ada",email:"ada@example.com",serviceIds:[],projectSummary:"Build it"});expect(r.status).toBe(422)});
  it("creates a valid project request",async()=>{db.service.count.mockResolvedValue(1);db.projectRequest.create.mockResolvedValue({id:uuid});const r=await request(app).post("/api/v1/project-requests").send({name:"Ada",email:"ada@example.com",serviceIds:[uuid],projectSummary:"Build it",goals:["Launch a useful product"],targetAudience:"Existing customers",consentToContact:true});expect(r.status).toBe(201)});
  it("rejects unauthorized admin access",async()=>{expect((await request(app).get("/api/v1/admin/services")).status).toBe(401)});
  it("rejects invalid login",async()=>{db.admin.findUnique.mockResolvedValue(null);expect((await request(app).post("/api/v1/admin/auth/login").send({email:"admin@example.com",password:"wrongpass"})).status).toBe(401)});
  it("logs in an active admin",async()=>{db.admin.findUnique.mockResolvedValue({id:uuid,name:"Admin",email:"admin@example.com",role:"ADMIN",isActive:true,passwordHash:await argon2.hash("password123")});db.admin.update.mockResolvedValue({});const r=await request(app).post("/api/v1/admin/auth/login").send({email:"admin@example.com",password:"password123"});expect(r.status).toBe(200);expect(r.headers["set-cookie"][0]).toContain("HttpOnly")});
  it("creates a service as an administrator",async()=>{db.admin.findFirst.mockResolvedValue({id:uuid,role:"ADMIN"});db.service.findFirst.mockResolvedValue(null);db.service.create.mockResolvedValue({id:uuid,slug:"new-service"});const r=await request(app).post("/api/v1/admin/services").set("Cookie",adminCookie).send({title:"New Service",shortDescription:"A useful service",description:"# Details"});expect(r.status).toBe(201);expect(r.body.data.slug).toBe("new-service")});
  it("bulk reorders services transactionally",async()=>{const second="22222222-2222-4222-8222-222222222222";db.admin.findFirst.mockResolvedValue({id:uuid,role:"ADMIN"});db.service.count.mockResolvedValue(2);db.service.update.mockResolvedValue({});const r=await request(app).post("/api/v1/admin/services/reorder").set("Cookie",adminCookie).send({ids:[uuid,second]});expect(r.status).toBe(200);expect(db.$transaction).toHaveBeenCalled();expect(db.service.update).toHaveBeenNthCalledWith(1,expect.objectContaining({data:{order:0}}))});
  it("exposes healthy database state without secrets",async()=>{const r=await request(app).get("/api/v1/health");expect(r.body.data.database).toBe("up");expect(JSON.stringify(r.body)).not.toContain("test-secret")});
});
