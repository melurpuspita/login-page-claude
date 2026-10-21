import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Test bawaan memakai API asli (fetch di-stub); test mode dummy menyalakannya sendiri.
vi.stubEnv("VITE_DUMMY_LOGIN", "false");

// jsdom tidak mengimplementasikan canvas; game cukup melewati render loop.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
