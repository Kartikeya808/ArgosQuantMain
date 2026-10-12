import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError } from "@/lib/apiClient";
import styles from "./Login.module.css";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await onLogin(email.trim(), password);
      else await onRegister(name.trim(), email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Invalid email or password."
            : err.status === 409
              ? "An account with that email already exists."
              : err.message,
        );
      } else {
        setError("Could not reach the server. Is the backend running?");
      }
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logo}>◆</span>
          <div>
            <h1 className={styles.title}>ArgosQuant</h1>
            <p className={styles.tagline}>
              Portfolio &amp; Quantitative Risk Analytics
            </p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form className={styles.form} onSubmit={submit}>
          {mode === "register" && (
            <label className={styles.field}>
              <span>Name</span>
              <Input
                icon="user"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Investor"
                required
              />
            </label>
          )}
          <label className={styles.field}>
            <span>Email</span>
            <Input
              icon="mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <Input
              icon="lock"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={busy}
            className={styles.submit}
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className={styles.hint}>
          Connected to the Java backend on <code>:8080</code>. A starter
          portfolio is created automatically on first sign-up.
        </p>
      </div>
    </div>
  );
}
