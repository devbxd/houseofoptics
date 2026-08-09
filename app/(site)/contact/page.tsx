import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings, whatsappLink, phoneLink } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez House of Optics — WhatsApp, email et Instagram.",
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0">
      <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppBadge() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0">
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path
        fill="#25D366"
        d="M23.47 8.52A10.4 10.4 0 0 0 16.02 5.3c-5.74 0-10.42 4.68-10.42 10.42 0 1.84.48 3.63 1.4 5.21L5.5 26.7l6-1.57a10.4 10.4 0 0 0 4.98 1.27h.01c5.74 0 10.42-4.68 10.42-10.42a10.36 10.36 0 0 0-3.44-7.46Zm-7.45 16.02h-.01a8.66 8.66 0 0 1-4.41-1.21l-.32-.19-3.27.86.88-3.19-.21-.33a8.63 8.63 0 0 1-1.33-4.57c0-4.77 3.88-8.65 8.66-8.65a8.6 8.6 0 0 1 6.12 2.54 8.6 8.6 0 0 1 2.53 6.12c0 4.77-3.88 8.62-8.64 8.62Zm4.75-6.47c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.3-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.51-.42-.44-.58-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.74 4.35 3.84.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default async function ContactPage() {
  const [settings, { t }] = await Promise.all([getSiteSettings(), getServerDict()]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-serif text-2xl">{t["contact.title"]}</h1>
      <p className="mt-3 text-neutral-600">{t["contact.subtitle"]}</p>

      <div className="mt-10 space-y-4">
        {settings.contact_email && (
          <a
            href={`mailto:${settings.contact_email}`}
            className="flex items-center justify-center gap-3 border border-neutral-300 py-3 hover:border-brand-black"
          >
            <MailIcon />
            {settings.contact_email}
          </a>
        )}
        {settings.whatsapp_number && (
          <a
            href={phoneLink(settings.whatsapp_number)}
            className="flex items-center justify-center gap-3 border border-neutral-300 py-3 hover:border-brand-black"
          >
            <PhoneIcon />
            {t["contact.call"]}
          </a>
        )}
        {settings.whatsapp_number && (
          <a
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-green-600 py-3 text-white hover:opacity-90"
          >
            <WhatsAppBadge />
            {t["nav.whatsapp"]}
          </a>
        )}
        {settings.instagram_handle && (
          <a
            href={`https://instagram.com/${settings.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 border border-neutral-300 py-3 hover:border-brand-black"
          >
            <InstagramIcon />@{settings.instagram_handle}
          </a>
        )}
      </div>

      <Link
        href="/emplacement"
        className="mt-6 inline-flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-brand-black"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
          <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
        {t["location.viewOnMap"]}
      </Link>
    </main>
  );
}
