import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom tidak mengimplementasikan canvas; game cukup melewati render loop.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });

afterEach(() => cleanup());
