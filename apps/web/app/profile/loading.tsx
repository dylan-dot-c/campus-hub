export default function Loading() {
  return <div role="status" aria-label="Loading profile" className="space-y-4">
    {[1, 2, 3, 4].map((key) => <div key={key} className="h-12 rounded bg-neutral-200" />)}
    <span className="sr-only">Loading profile…</span>
  </div>;
}
