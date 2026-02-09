import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET || "accruals-secret-key-2026";

export interface AuthPayload {
  userId: number;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userEmail?: string;
      userRoles?: string[];
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRoles = payload.roles;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRoles || !roles.some(r => req.userRoles!.includes(r))) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function requireAnyRole(roles: string[]) {
  return requireRole(...roles);
}
