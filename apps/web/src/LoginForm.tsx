import { useState, type FormEvent } from "react";
import type { AuthUser } from "@login-lab/shared";
import { InvalidCredentialsError, isDummyLogin, login } from "./api";

export function LoginForm({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const user = await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      onSuccess(user);
    } catch (err) {
      setError(
        err instanceof InvalidCredentialsError
          ? "Email atau password salah"
          : "Terjadi kesalahan, coba lagi",
      );
      setSubmitting(false);
    }
  }

  const dummy = isDummyLogin();

  return (
    <form onSubmit={onSubmit}>
      {dummy && <p className="demo-note">Mode demo: isi email dan password apa saja untuk masuk.</p>}
      <label>
        Email <input name="email" type={dummy ? "text" : "email"} required autoComplete="email" placeholder="kucing@galaksi.id" />
      </label>
      <label>
        Password{" "}
        <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
      </label>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Memproses..." : "Masuk"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
