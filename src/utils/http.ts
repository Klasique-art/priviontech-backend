import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}
export const ok = (res: Response, data: unknown, meta?: unknown, status = 200) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => void fn(req, res, next).catch(next);
export const validate = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    const value = schema.parse({ body: req.body, params: req.params, query: req.query });
    Object.assign(req, value);
    next();
  } catch (error) { next(error); }
};
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(error.issues.map((i) => [i.path.slice(1).join("."), i.message]));
    return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "The submitted data is invalid.", fields } });
  }
  if (error instanceof AppError)
    return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } });
  if ((error as { code?: string }).code === "P2002")
    return res.status(409).json({ success: false, error: { code: "CONFLICT", message: "A record with that unique value already exists." } });
  console.error(error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
}
