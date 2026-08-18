"use client";

import { useState } from "react";
import { setSpinWheelEnabled } from "./actions";

export function SpinWheelToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);

  return (
    <label className="flex max-w-md cursor-pointer items-center justify-between gap-4 rounded-md border border-neutral-200 bg-white p-4">
      <span>
        <span className="block text-sm font-medium">Spin-to-win wheel</span>
        <span className="block text-xs text-neutral-500">
          Shows a spin-the-wheel pop-up (0%, 10% or 15% off) to first-time visitors. Winning codes work for real
          at checkout. While this is on, any promo pop-up from Admin → Pop-ups is hidden — only one of the two
          shows at a time.
        </span>
      </span>
      <input
        type="checkbox"
        checked={enabled}
        disabled={pending}
        onChange={async (e) => {
          const next = e.target.checked;
          setPending(true);
          try {
            await setSpinWheelEnabled(next);
            setEnabled(next);
          } finally {
            setPending(false);
          }
        }}
        className="h-5 w-5 shrink-0 accent-brand-black"
      />
    </label>
  );
}
