import Link from "next/link";
import { whatsappLink } from "@/lib/settings";

type Props = {
  whatsappNumber: string;
  contactEmail: string;
  t: Record<string, string>;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-white">
      <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        fill="#fff"
        d="M23.47 8.52A10.4 10.4 0 0 0 16.02 5.3c-5.74 0-10.42 4.68-10.42 10.42 0 1.84.48 3.63 1.4 5.21L5.5 26.7l6-1.57a10.4 10.4 0 0 0 4.98 1.27h.01c5.74 0 10.42-4.68 10.42-10.42a10.36 10.36 0 0 0-3.44-7.46Zm-7.45 16.02h-.01a8.66 8.66 0 0 1-4.41-1.21l-.32-.19-3.27.86.88-3.19-.21-.33a8.63 8.63 0 0 1-1.33-4.57c0-4.77 3.88-8.65 8.66-8.65a8.6 8.6 0 0 1 6.12 2.54 8.6 8.6 0 0 1 2.53 6.12c0 4.77-3.88 8.62-8.64 8.62Zm4.75-6.47c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.3-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.51-.42-.44-.58-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.74 4.35 3.84.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3Z"
      />
    </svg>
  );
}

export function BottomNav({ whatsappNumber, contactEmail, t }: Props) {
  const wa = whatsappNumber ? whatsappLink(whatsappNumber) : "/contact";
  const mail = contactEmail ? `mailto:${contactEmail}` : "/contact";

  const items = [
    { href: "/", label: t["nav.home"], icon: <HomeIcon /> },
    { href: "/produits", label: t["nav.products"], icon: <ProductsIcon /> },
    { href: mail, label: "", icon: <MailIcon />, center: true },
    { href: "/contact", label: t["nav.contact"], icon: <ChatIcon /> },
    { href: wa, label: t["nav.whatsapp"], icon: <WhatsAppIcon />, external: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around border-t border-neutral-200 bg-white">
      {items.map((item) =>
        item.center ? (
          <a
            key={item.label || "contact-center"}
            href={item.href}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red shadow-lg"
            aria-label="Contact par email"
          >
            {item.icon}
          </a>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="flex flex-col items-center gap-1 text-neutral-600 hover:text-brand-black"
          >
            {item.icon}
            <span className="text-[11px] leading-none">{item.label}</span>
          </Link>
        )
      )}
    </nav>
  );
}
