import { useEffect, useState } from "react";
import type { AuthUser } from "@login-lab/shared";
import { logout, me } from "./api";
import { LoginForm } from "./LoginForm";

type Session = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: AuthUser };

export function App() {
  const [session, setSession] = useState<Session>({ status: "loading" });

  useEffect(() => {
    me()
      .then((user) => setSession(user ? { status: "authenticated", user } : { status: "anonymous" }))
      .catch(() => setSession({ status: "anonymous" }));
  }, []);

  async function onLogout() {
    await logout().catch(() => undefined);
    setSession({ status: "anonymous" });
  }

  return (
    <main>
      <h1>Login Lab</h1>
      {session.status === "loading" && <p className="status">Memuat...</p>}
      {session.status === "anonymous" && (
        <LoginForm onSuccess={(user) => setSession({ status: "authenticated", user })} />
      )}
      {session.status === "authenticated" && (
        <>
          <p className="greeting">Halo, <strong>{session.user.email}</strong></p>
          <button onClick={onLogout}>Keluar</button>
        </>
      )}
    </main>
  );
}
