import { ChristmasTheme } from "./ChristmasTheme";
import { HalloweenTheme } from "./HalloweenTheme";
import { NewYearTheme } from "./NewYearTheme";

export type EventKey = "christmas" | "halloween" | "newyear";

export const EVENT_THEME_BY_SLUG: Record<string, EventKey> = {
  noel: "christmas",
  halloween: "halloween",
  "nouvel-an": "newyear",
};

export const EVENT_BG_CLASS: Record<EventKey, string> = {
  christmas: "bg-gradient-to-b from-[#0b2e1f] via-[#0e3b28] to-[#0b2e1f] text-white",
  halloween: "bg-gradient-to-b from-[#1a0f26] via-[#241333] to-[#150a1f] text-white",
  newyear: "bg-gradient-to-b from-[#0a0a1a] via-[#141432] to-[#0a0a1a] text-white",
};

export function EventDecor({ theme }: { theme: EventKey }) {
  if (theme === "christmas") return <ChristmasTheme />;
  if (theme === "halloween") return <HalloweenTheme />;
  return <NewYearTheme />;
}
