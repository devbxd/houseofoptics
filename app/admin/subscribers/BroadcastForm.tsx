"use client";

import { useActionState } from "react";
import { sendBroadcast } from "./actions";

const initialState = { sent: 0, error: null as string | null };

export function BroadcastForm({ subscriberCount }: { subscriberCount: number }) {
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    return sendBroadcast(formData);
  }, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">
        Sends to all {subscriberCount} newsletter subscriber{subscriberCount === 1 ? "" : "s"}.
      </p>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Subject</label>
        <input name="subject" required className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Message</label>
        <textarea name="message" rows={5} required className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
      </div>
      <button
        type="submit"
        disabled={pending || subscriberCount === 0}
        className="bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send to all subscribers"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {!state.error && state.sent > 0 && <p className="text-sm text-green-700">Sent to {state.sent} subscribers.</p>}
    </form>
  );
}
