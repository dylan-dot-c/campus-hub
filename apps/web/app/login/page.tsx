import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <LoginForm />
      <p className="text-sm text-neutral-600">
        No account?{" "}
        <a href="/signup" className="text-blue-600 underline underline-offset-2">
          Create one
        </a>
      </p>
    </main>
  );
}
