"use client";

import { useState } from "react";

// one status instead of booleans — can't be submitting and error at once
// empty vs ready is derived from the inputs (see docs/specs/students/students.md)
type Status = "idle" | "submitting" | "done" | "error";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMes, setErrorMes] = useState("");

  const filled = email.trim() !== "" && password !== "";
  const submitting = status === "submitting";

  // typing leaves done/error and goes back to empty/ready
  function edit(set: (v: string) => void, value: string) {
    set(value);
    if (status === "done" || status === "error") setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setEmail("");
        setPassword("");
        setStatus("done");
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
            value={password}
            onChange={(e) => edit(setPassword, e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </fieldset>

      {status === "error" && <p className="text-sm text-red-600">{errorMes}</p>}
      {status === "done" && <p className="text-sm text-green-700">Account created</p>}

      <button
        type="submit"
        disabled={!filled || submitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-40"
      >
        {submitting ? "Creating…" : "Sign up"}
      </button>
    </form>
  );
}
