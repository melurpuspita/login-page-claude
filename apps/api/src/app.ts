import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import {
  isLoginRequest,
  normalizeEmail,
  type ApiError,
  type AuthUser,
  type HealthResponse,
  type LoginResponse,
} from "@login-lab/shared";
import { COOKIE_NAME, TOKEN_TTL_SECONDS, cookieOptions, requireAuth, signToken } from "./auth";
import { BCRYPT_COST, type UserRepository } from "./users";

export interface AppDeps {
  users: UserRepository;
  jwtSecret: string;
  corsOrigin: string;
  secureCookies?: boolean;
  loginRateLimit?: { max: number; windowMs: number };
}

// Hash pembanding agar waktu respons tetap seragam saat email tidak terdaftar.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", BCRYPT_COST);

const INVALID_CREDENTIALS: ApiError = { error: "Email atau password salah" };

export function createApp(deps: AppDeps) {
  const { users, jwtSecret, corsOrigin } = deps;
  const secure = deps.secureCookies ?? false;
  const limit = deps.loginRateLimit ?? { max: 10, windowMs: 15 * 60 * 1000 };

  const app = express();
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", timestamp: new Date().toISOString() };
    res.json(body);
  });

  const loginLimiter = rateLimit({
    windowMs: limit.windowMs,
    limit: limit.max,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Terlalu banyak percobaan, coba lagi nanti" } satisfies ApiError,
  });

  app.post("/auth/login", loginLimiter, async (req, res, next) => {
    try {
      if (!isLoginRequest(req.body)) {
        res.status(400).json({ error: "Email atau password tidak valid" } satisfies ApiError);
        return;
      }
      const { email, password } = req.body;
      const user = await users.findByEmail(normalizeEmail(email));
      const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) {
        res.status(401).json(INVALID_CREDENTIALS);
        return;
      }
      const authUser: AuthUser = { id: user.id, email: user.email };
      res.cookie(COOKIE_NAME, signToken(authUser, jwtSecret), {
        ...cookieOptions(secure),
        maxAge: TOKEN_TTL_SECONDS * 1000,
      });
      res.json({ user: authUser } satisfies LoginResponse);
    } catch (err) {
      next(err);
    }
  });

  app.post("/auth/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME, cookieOptions(secure));
    res.status(204).end();
  });

  app.get("/auth/me", requireAuth(jwtSecret, secure), (_req, res) => {
    res.json({ user: res.locals.user as AuthUser } satisfies LoginResponse);
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "Body bukan JSON valid" } satisfies ApiError);
      return;
    }
    console.error(err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Terjadi kesalahan server" } satisfies ApiError);
  };
  app.use(errorHandler);

  return app;
}
