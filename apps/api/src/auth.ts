import type { CookieOptions, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "@login-lab/shared";

export const COOKIE_NAME = "token";
export const TOKEN_TTL_SECONDS = 60 * 60;

export function cookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: "lax", secure, path: "/" };
}

export function signToken(user: AuthUser, secret: string, expiresIn = TOKEN_TTL_SECONDS): string {
  return jwt.sign({ sub: user.id, email: user.email }, secret, {
    algorithm: "HS256",
    expiresIn,
  });
}

export function verifyToken(token: string, secret: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function requireAuth(secret: string, secure: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[COOKIE_NAME];
    const user = typeof token === "string" ? verifyToken(token, secret) : null;
    if (!user) {
      res.clearCookie(COOKIE_NAME, cookieOptions(secure));
      res.status(401).json({ error: "Tidak terautentikasi" });
      return;
    }
    res.locals.user = user;
    next();
  };
}
