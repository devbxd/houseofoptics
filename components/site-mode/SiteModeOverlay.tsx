import type { SiteMode } from "@/lib/settings";
import { ChristmasMode } from "./ChristmasMode";
import { HalloweenMode } from "./HalloweenMode";

export const SITE_MODE_LABEL: Record<NonNullable<SiteMode>, string> = {
  noel: "Noël & Nouvel An",
  halloween: "Halloween",
  nouvel_an: "Noël & Nouvel An",
};

export function SiteModeOverlay({ mode, t }: { mode: NonNullable<SiteMode>; t: Record<string, string> }) {
  if (mode === "halloween") return <HalloweenMode />;
  // "noel" and the legacy "nouvel_an" value both render the combined
  // Christmas + New Year look — the two were merged into one mode.
  return <ChristmasMode t={t} />;
}
