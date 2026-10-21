import { useEffect, useState } from "react";
import type { AuthUser } from "@login-lab/shared";
import { logout, me } from "./api";
import { catDataUrl } from "./catArt";
import { LoginForm } from "./LoginForm";
import { SpaceBackdrop } from "./SpaceBackdrop";
import { SpaceGame } from "./SpaceGame";

type Session = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: AuthUser };

const CAT_IMG = catDataUrl(true);

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

  if (session.status === "authenticated") {
    return <SpaceGame user={session.user} onLogout={onLogout} />;
  }

  return (
    <SpaceBackdrop>
      <main className="login-card">
        <div className="login-cat" aria-hidden="true">
          <span className="sparkles" />
          <img src={CAT_IMG} alt="" width={156} height={101} />
        </div>
        <h1>Kucing Kosmik</h1>
        <p className="tagline">Masuk dulu, lalu terbang memburu camilan di luar angkasa.</p>
        {session.status === "loading" ? (
          <p className="status">Memuat...</p>
        ) : (
          <LoginForm onSuccess={(user) => setSession({ status: "authenticated", user })} />
        )}
      </main>
    </SpaceBackdrop>
  );
}
