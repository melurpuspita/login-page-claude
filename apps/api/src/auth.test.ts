import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./auth";

const user = { id: "u1", email: "a@b.co" };

describe("token", () => {
  it("sign lalu verify mengembalikan user", () => {
    expect(verifyToken(signToken(user, "s3cret"), "s3cret")).toEqual(user);
  });
  it("menolak secret berbeda", () => {
    expect(verifyToken(signToken(user, "s3cret"), "lain")).toBeNull();
  });
  it("menolak token rusak", () => {
    expect(verifyToken("bukan.token.valid", "s3cret")).toBeNull();
  });
  it("menolak token kedaluwarsa", () => {
    expect(verifyToken(signToken(user, "s3cret", -10), "s3cret")).toBeNull();
  });
});
