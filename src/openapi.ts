const success = { type: "object", required: ["success","data"], properties: { success: { type:"boolean", enum:[true] }, data: {}, meta: { type:"object" } } };
const error = { type:"object", properties:{ success:{type:"boolean",enum:[false]},error:{type:"object",properties:{code:{type:"string"},message:{type:"string"},fields:{type:"object"}}}}};
const paths: Record<string, Record<string, unknown>> = {};
function endpoint(path:string, method:string, summary:string, options:Record<string,unknown>={}) {
  paths[path] ??= {}; paths[path][method] = { summary, tags:[path.includes("/admin")?"Admin":"Public"], ...options, responses:{ "200":{description:"Success",content:{"application/json":{schema:success}}},"422":{description:"Validation error",content:{"application/json":{schema:error}}},...options.responses as object } };
}
endpoint("/health","get","API and database health");
endpoint("/services","get","Paginated, searchable and filterable active services",{parameters:["page","limit","search","category","technology","sort"].map(name=>({in:"query",name,schema:{type:name==="page"||name==="limit"?"integer":"string"}}))});
endpoint("/services/{slug}","get","Get an active service",{parameters:[{in:"path",name:"slug",required:true,schema:{type:"string"}}]});
endpoint("/projects","get","List and filter published projects",{parameters:["page","limit","search","service","technology","platform","kind","featured","sort"].map(name=>({in:"query",name,schema:{type:name==="page"||name==="limit"?"integer":"string"}}))});
endpoint("/projects/{slug}","get","Get a published project");
endpoint("/enquiries","post","Submit an enquiry");
endpoint("/project-requests","post","Submit a project request");
endpoint("/service-requests","post","Submit a detailed multi-step service request");
endpoint("/settings","get","Read public settings");
endpoint("/admin/auth/login","post","Admin login");
endpoint("/admin/auth/logout","post","Admin logout");
endpoint("/admin/auth/me","get","Current administrator");
endpoint("/admin/auth/change-password","post","Change password");
endpoint("/admin/dashboard","get","Dashboard counts");
for(const resource of ["services","projects","enquiries","project-requests"]){
  endpoint(`/admin/${resource}`,"get",`List ${resource}`); if(!["enquiries","project-requests"].includes(resource))endpoint(`/admin/${resource}`,"post",`Create ${resource}`);
  endpoint(`/admin/${resource}/{id}`,"get",`Get ${resource}`); endpoint(`/admin/${resource}/{id}`,"patch",`Update ${resource}`); endpoint(`/admin/${resource}/{id}`,"delete",`Delete ${resource}`);
}
endpoint("/admin/services/reorder","post","Bulk reorder services");
endpoint("/admin/projects/reorder","post","Bulk reorder projects");
for(const action of ["archive","restore"]) endpoint(`/admin/services/{id}/${action}`,"post",`${action} service`);
for(const action of ["publish","unpublish","archive","restore"]) endpoint(`/admin/projects/{id}/${action}`,"post",`${action} project`);
endpoint("/admin/services/{id}/permanent","delete","Permanently delete a service");
endpoint("/admin/settings","get","Read all settings"); endpoint("/admin/settings","put","Update settings");
export const openapi = { openapi:"3.1.0",info:{title:"Privion Technologies API",version:"1.0.0",description:"REST API for Privion public content and administration."},servers:[{url:"/api/v1"}],components:{securitySchemes:{cookieAuth:{type:"apiKey",in:"cookie",name:"privion_admin"}},schemas:{ApiSuccess:success,ApiError:error}},paths };
