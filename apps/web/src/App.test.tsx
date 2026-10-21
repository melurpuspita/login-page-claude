import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const USER = { id: "u1", email: "user@example.com" };

type Handler = () => Response | Promise<Response>;
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

function stubApi(routes: Record<string, Handler>) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const handler = routes[`${init?.method ?? "GET"} ${path}`];
    if (!handler) throw new Error(`unexpected ${init?.method ?? "GET"} ${path}`);
    return handler();
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function fillAndSubmit() {
  await userEvent.type(await screen.findByLabelText(/email/i), "user@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "secret");
  await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
}

afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("menampilkan form login saat belum ada sesi", async () => {
    stubApi({ "GET /auth/me": () => json(401, { error: "x" }) });
    render(<App />);
    expect(await screen.findByRole("button", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("langsung menampilkan sapaan saat sesi aktif", async () => {
    stubApi({ "GET /auth/me": () => json(200, { user: USER }) });
    render(<App />);
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("login sukses menampilkan sapaan dan mengirim credentials include", async () => {
    const fetchMock = stubApi({
      "GET /auth/me": () => json(401),
      "POST /auth/login": () => json(200, { user: USER }),
    });
    render(<App />);
    await fillAndSubmit();
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    const loginCall = fetchMock.mock.calls.find(([u]) => u.endsWith("/auth/login"))!;
    expect(loginCall[1]?.credentials).toBe("include");
  });

  it("401 menampilkan pesan kredensial salah", async () => {
    stubApi({
      "GET /auth/me": () => json(401),
      "POST /auth/login": () => json(401, { error: "x" }),
    });
    render(<App />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Email atau password salah");
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
  });

  it("error jaringan menampilkan pesan umum dan form bisa dipakai lagi", async () => {
    stubApi({
      "GET /auth/me": () => json(401),
      "POST /auth/login": () => {
        throw new TypeError("network");
      },
    });
    render(<App />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Terjadi kesalahan");
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
  });

  it("tombol disabled selama request berjalan", async () => {
    let resolve!: (r: Response) => void;
    stubApi({
      "GET /auth/me": () => json(401),
      "POST /auth/login": () => new Promise<Response>((r) => (resolve = r)),
    });
    render(<App />);
    await fillAndSubmit();
    expect(await screen.findByRole("button", { name: "Memproses..." })).toBeDisabled();
    resolve(json(200, { user: USER }));
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
  });

  it("logout mengembalikan form", async () => {
    stubApi({
      "GET /auth/me": () => json(200, { user: USER }),
      "POST /auth/logout": () => json(204),
    });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Keluar" }));
    expect(await screen.findByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });

  it("setelah login menampilkan game luar angkasa dengan skor awal", async () => {
    stubApi({ "GET /auth/me": () => json(200, { user: USER }) });
    render(<App />);
    expect(await screen.findByRole("button", { name: "Mulai terbang" })).toBeInTheDocument();
    expect(screen.getByText("Skor")).toBeInTheDocument();
    expect(screen.getByLabelText("Nyawa 3 dari 3")).toBeInTheDocument();
  });
});
