import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@/config/db";
import { env } from "@/config/env";
import { AppError } from "@/utils/http";

type Token = { sub: string; role: "ADMIN" | "EDITOR" };
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[env.COOKIE_NAME] as string | undefined;
    if (!raw) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    const token = jwt.verify(raw, env.JWT_SECRET) as Token;
    const admin = await prisma.admin.findFirst({ where: { id: token.sub, isActive: true }, select: { id: true, role: true } });
    if (!admin) throw new AppError(401, "UNAUTHORIZED", "Authentication is invalid.");
    req.admin = admin;
    next();
  } catch (e) { next(e instanceof AppError ? e : new AppError(401, "UNAUTHORIZED", "Authentication is invalid.")); }
}
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) =>
  req.admin?.role === "ADMIN" ? next() : next(new AppError(403, "FORBIDDEN", "Administrator role is required."));
