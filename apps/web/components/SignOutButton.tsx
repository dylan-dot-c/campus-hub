"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/sessions", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="text-blue-600 underline underline-offset-2">
      Sign out
    </button>
  );
}
