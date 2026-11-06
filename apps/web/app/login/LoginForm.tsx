"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// same one-status shape as SignupForm; success leaves the page instead of a "done" state
type Status = "idle" | "submitting" | "error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMes, setErrorMes] = useState("");

  const filled = email.trim() !== "" && password !== "";
  const submitting = status === "submitting";

  function edit(set: (v: string) => void, value: string) {
    set(value);
    if (status === "error") setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/profile");
        router.refresh(); // the layout header re-reads the session
      } else {
        const data = await res.json().catch(() => null);
        setErrorMes(data?.error?.message ?? "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrorMes("Could not reach the server. Try again later.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={submitting} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium">CUNY email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => edit(setEmail, e.target.value)}
            placeholder="you@baruch.cuny.edu"
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => edit(setPassword, e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </fieldset>

      {status === "error" && <p className="text-sm text-red-600">{errorMes}</p>}

      <button
        type="submit"
        disabled={!filled || submitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-40"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
