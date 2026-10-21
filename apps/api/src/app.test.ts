import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { signToken } from "./auth";
import { createInMemoryUserRepository } from "./users";

const SECRET = "test-secret";
const EMAIL = "user@example.com";
const PASSWORD = "correct-horse";

let make: (opts?: { max?: number }) => ReturnType<typeof createApp>;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const users = createInMemoryUserRepository([{ id: "u1", email: EMAIL, passwordHash }]);
  make = (opts = {}) =>
    createApp({
      users,
      jwtSecret: SECRET,
      corsOrigin: "http://localhost:5173",
      loginRateLimit: { max: opts.max ?? 100, windowMs: 60_000 },
    });
});

const login = (app: ReturnType<typeof createApp>, body: unknown) =>
  request(app).post("/auth/login").send(body as object);

describe("GET /health", () => {
  it("mengembalikan status ok", async () => {
    const res = await request(make()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /auth/login", () => {
  it("sukses: set cookie httpOnly dan tidak membocorkan password/hash", async () => {
    const res = await login(make(), { email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: "u1", email: EMAIL } });
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
  });

  it("menormalkan kapitalisasi dan spasi email", async () => {
    const res = await login(make(), { email: "  USER@Example.com ", password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it("password salah dan email tak dikenal menghasilkan 401 identik", async () => {
    const app = make();
    const wrongPw = await login(app, { email: EMAIL, password: "salah" });
    const unknown = await login(app, { email: "nobody@example.com", password: PASSWORD });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body).toEqual(unknown.body);
    expect(wrongPw.headers["set-cookie"]).toBeUndefined();
  });

  it.each([
    ["field hilang", { email: EMAIL }],
    ["email invalid", { email: "bukan-email", password: PASSWORD }],
    ["password kosong", { email: EMAIL, password: "" }],
    ["password terlalu panjang", { email: EMAIL, password: "x".repeat(129) }],
    ["password bukan string", { email: EMAIL, password: 123 }],
  ])("400 untuk %s", async (_name, body) => {
    const res = await login(make(), body);
    expect(res.status).toBe(400);
  });

  it("400 untuk body bukan JSON", async () => {
    const res = await request(make())
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{bukan json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("429 setelah melebihi batas percobaan gagal", async () => {
    const app = make({ max: 3 });
    for (let i = 0; i < 3; i++) {
      expect((await login(app, { email: EMAIL, password: "salah" })).status).toBe(401);
    }
    expect((await login(app, { email: EMAIL, password: "salah" })).status).toBe(429);
  });
});

describe("GET /auth/me", () => {
  it("401 tanpa cookie", async () => {
    expect((await request(make()).get("/auth/me")).status).toBe(401);
  });

  it("200 dengan cookie dari login", async () => {
    const agent = request.agent(make());
    await agent.post("/auth/login").send({ email: EMAIL, password: PASSWORD });
    const res = await agent.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(EMAIL);
  });

  it("401 untuk token kedaluwarsa", async () => {
    const token = signToken({ id: "u1", email: EMAIL }, SECRET, -10);
    const res = await request(make()).get("/auth/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(401);
  });

  it("401 untuk token bertanda tangan secret lain", async () => {
    const token = signToken({ id: "u1", email: EMAIL }, "secret-lain");
    const res = await request(make()).get("/auth/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("menghapus cookie sehingga /auth/me kembali 401", async () => {
    const agent = request.agent(make());
    await agent.post("/auth/login").send({ email: EMAIL, password: PASSWORD });
    const out = await agent.post("/auth/logout");
    expect(out.status).toBe(204);
    expect(String(out.headers["set-cookie"])).toMatch(/token=;/);
    expect((await agent.get("/auth/me")).status).toBe(401);
  });
});
