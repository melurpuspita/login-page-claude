import { describe, expect, it } from "vitest";
import { MAX_PASSWORD_LENGTH, isLoginRequest, normalizeEmail } from "./index";

describe("isLoginRequest", () => {
  it("menerima payload valid", () => {
    expect(isLoginRequest({ email: "a@b.co", password: "x" })).toBe(true);
  });
  it("menolak field hilang atau bukan string", () => {
    expect(isLoginRequest({ email: "a@b.co" })).toBe(false);
    expect(isLoginRequest({ password: "x" })).toBe(false);
    expect(isLoginRequest({ email: "a@b.co", password: 123 })).toBe(false);
  });
  it("menolak null, array, dan primitif", () => {
    expect(isLoginRequest(null)).toBe(false);
    expect(isLoginRequest([])).toBe(false);
    expect(isLoginRequest("x")).toBe(false);
  });
  it("menolak email berformat salah", () => {
    expect(isLoginRequest({ email: "bukan-email", password: "x" })).toBe(false);
    expect(isLoginRequest({ email: "a@b", password: "x" })).toBe(false);
  });
  it("menolak password kosong atau terlalu panjang", () => {
    expect(isLoginRequest({ email: "a@b.co", password: "" })).toBe(false);
    const long = "x".repeat(MAX_PASSWORD_LENGTH + 1);
    expect(isLoginRequest({ email: "a@b.co", password: long })).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("trim dan lowercase", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});
