export type SortDirection = "asc" | "desc";
export interface ServiceProcessStep { step:number; title:string; description:string; duration?:string|null }
export interface Faq { question:string; answer:string }
export interface Service {
  id:string; title:string; slug:string; tagline?:string|null; category?:string|null; shortDescription:string;
  description?:string; icon?:string|null; imageUrl?:string|null; heroImageUrl?:string|null; features:string[];
  benefits:string[]; deliverables?:string[]; technologies:string[]; process?:ServiceProcessStep[]|null; faqs?:Faq[]|null;
  startingPrice?:string|null; estimatedTimeline?:string|null; order:number; updatedAt?:string;
}
export type ProjectKind="WEBSITE"|"WEB_APP"|"MOBILE_APP"|"DESKTOP_APP"|"PLATFORM"|"CASE_STUDY";
export interface ProjectResult { label:string; value:string; description?:string|null }
export interface Project {
  id:string; title:string; slug:string; kind:ProjectKind; clientName?:string|null; summary:string; content:string;
  coverImageUrl?:string|null; galleryImages:string[]; screenshots:string[]; services:Service[]; technologies:string[];
  platforms:string[]; features:string[]; projectUrl?:string|null; playStoreUrl?:string|null; appStoreUrl?:string|null;
  results?:ProjectResult[]|null; completionDate?:string|null; order:number; status:"PUBLISHED"; isFeatured:boolean; publishedAt?:string|null;
}
export interface EnquiryInput { name:string; email:string; phone?:string; company?:string; subject:string; message:string; website?:string }
export type ContactPreference="EMAIL"|"PHONE"|"WHATSAPP"|"VIDEO_CALL";
export interface ProjectRequestInput {
  name:string; email:string; phone?:string; company?:string; serviceIds:string[]; projectType?:string; projectSummary:string;
  goals:string[]; targetAudience:string; requiredFeatures?:string[]; preferredPlatforms?:string[]; inspirationUrls?:string[];
  budgetRange?:string; budgetMin?:number; budgetMax?:number; budgetCurrency?:string; desiredStartDate?:string; timeline?:string;
  attachmentUrl?:string; attachmentUrls?:string[]; contactPreference?:ContactPreference;
  discoveryAnswers?:Record<string,string|string[]|number|boolean>; consentToContact:true; source?:string; website?:string;
}
export interface PublicSiteSettings { companyName:string; contactEmail:string; contactPhone?:string|null; address?:string|null; linkedInUrl?:string|null; defaultSeoTitle:string; defaultSeoDescription:string; updatedAt:string }
export interface ApiSuccessResponse<T> { success:true; data:T; meta?:Record<string,unknown> }
export interface ApiErrorResponse { success:false; error:{ code:string; message:string; fields?:Record<string,string> } }
export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> { meta:{ page:number; limit:number; total:number; totalPages:number } }
