"use client";

import { useState } from "react";
import Link from "next/link";
import { SocialIcons } from "./SocialIcons";

type FooterLink = { id: string; label: string; url: string };
type FooterSection = { id: string; title: string; links: FooterLink[] };

function isExternal(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");
}

function FooterAccordion({ title, links }: Omit<FooterSection, "id">) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/15">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm uppercase tracking-wide"
      >
        {title}
        <span className="relative h-3 w-3 shrink-0">
          <span className="absolute left-1/2 top-1/2 h-[1.5px] w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span
            className={`absolute left-1/2 top-1/2 h-[1.5px] w-3 -translate-x-1/2 -translate-y-1/2 bg-current transition-transform ${open ? "rotate-0" : "rotate-90"}`}
          />
        </span>
      </button>
      {open && (
        <ul className="space-y-2 pb-4 text-sm text-white/70">
          {links.map((l) =>
            isExternal(l.url) ? (
              <li key={l.id}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {l.label}
                </a>
              </li>
            ) : (
              <li key={l.id}>
                <Link href={l.url} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

export function Footer({
  brandName,
  sections,
  facebookUrl,
  instagramUrl,
  whatsappUrl,
  emailUrl,
  copyrightText,
}: {
  brandName: string;
  sections: FooterSection[];
  facebookUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  emailUrl: string;
  copyrightText: string;
}) {
  const year = new Date().getFullYear();
  const copyright = copyrightText || `© ${year} ${brandName}. All rights reserved.`;

  return (
    <footer className="bg-brand-black px-6 pb-10 pt-12 text-white">
      <div className="mx-auto max-w-6xl">
        <SocialIcons
          facebookUrl={facebookUrl}
          instagramUrl={instagramUrl}
          whatsappUrl={whatsappUrl}
          emailUrl={emailUrl}
          className="mb-8 flex items-center gap-5"
          iconClassName="h-5 w-5 text-white/70 transition-colors hover:text-white"
        />

        {sections.length > 0 && (
          <div className="border-t border-white/15">
            {sections.map((s) => (
              <FooterAccordion key={s.id} title={s.title} links={s.links} />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-white/50">{copyright}</p>
      </div>
    </footer>
  );
}
