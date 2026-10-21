import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("mode login dummy", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DUMMY_LOGIN", "true");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("tidak boleh memanggil API"))));
  });
  afterEach(() => {
    vi.stubEnv("VITE_DUMMY_LOGIN", "false");
    vi.unstubAllGlobals();
  });

  it("menerima kredensial apa pun tanpa memanggil API", async () => {
    render(<App />);
    await userEvent.type(await screen.findByLabelText(/email/i), "siapa saja");
    await userEvent.type(screen.getByLabelText(/password/i), "x");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText("siapa saja")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sesi bertahan saat dimuat ulang dan hilang setelah keluar", async () => {
    const first = render(<App />);
    await userEvent.type(await screen.findByLabelText(/email/i), "dev@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "apa-saja");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await screen.findByText("dev@example.com");
    first.unmount();

    render(<App />);
    expect(await screen.findByText("dev@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(await screen.findByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });
});
