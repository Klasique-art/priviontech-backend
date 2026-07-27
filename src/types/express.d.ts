import type { AdminRole } from "@prisma/client";
declare global {
  namespace Express {
    interface Request { admin?: { id: string; role: AdminRole } }
  }
}
export {};
