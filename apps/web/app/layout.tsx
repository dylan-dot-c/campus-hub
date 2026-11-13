// Root layout for the Next.js app. Wraps every page with the HTML shell,
// global styles, and a header that shows sign-in or sign-out.
import type { Metadata } from "next";
import { currentUserId } from "@project/auth";
import SignOutButton from "@/components/SignOutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starter Skeleton",
  description: "C12 Fall 2026 — every layer exists; the weeks make them deep.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserId();

  return (
    <html lang="en">
      <body className="mx-auto max-w-2xl px-4 py-10 font-sans text-neutral-900 antialiased">
        <header className="mb-8 flex justify-end text-sm">
          {userId ? (
            <SignOutButton />
          ) : (
            <a href="/login" className="text-blue-600 underline underline-offset-2">
              Sign in
            </a>
          )}
        </header>
        {children}
      </body>
    </html>
  );
}
