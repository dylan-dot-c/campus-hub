"use client";
export default function Error({ reset }: { reset: () => void }) {
  return <section className="p-6" role="alert">
    <h2>Could not load your profile</h2><p>Try loading it again.</p>
    <button type="button" onClick={reset} className="mt-3 rounded border p-2">Retry</button>
  </section>;
}
