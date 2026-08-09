import type { SiteMode } from "@/lib/settings";
import { ChristmasMode } from "./ChristmasMode";
import { HalloweenMode } from "./HalloweenMode";
import { NewYearMode } from "./NewYearMode";

export const SITE_MODE_LABEL: Record<NonNullable<SiteMode>, string> = {
  noel: "Noël",
  halloween: "Halloween",
  nouvel_an: "Nouvel An",
};

export function SiteModeOverlay({ mode, t }: { mode: NonNullable<SiteMode>; t: Record<string, string> }) {
  if (mode === "noel") return <ChristmasMode />;
  if (mode === "halloween") return <HalloweenMode />;
  return <NewYearMode t={t} />;
}
