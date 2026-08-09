"use client";

import { useTransition } from "react";
import { deleteClient } from "./actions";

export function ClientDeleteButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this client and all of their orders? This can't be undone.")) {
          startTransition(() => deleteClient(email));
        }
      }}
      className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
