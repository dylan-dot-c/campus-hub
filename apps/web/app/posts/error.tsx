"use client"; // Next.js requires error.tsx to be a client component

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function PostsError({ reset }: { reset: () => void }) {
  const router = useRouter();

  function retry() {
    // refresh() asks the server for the list again; reset() clears this card.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div role="alert" className="rounded-lg border border-red-300 p-4">
      <p>Couldn&apos;t load your posts.</p>
      <button type="button" onClick={retry}>
        Retry
      </button>
    </div>
  );
}
