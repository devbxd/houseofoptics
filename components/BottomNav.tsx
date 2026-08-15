import Link from "next/link";
import { whatsappLink } from "@/lib/settings";

type Props = {
  whatsappNumber: string;
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path
        d="M12 20.5s-7.5-4.8-9.8-9.6C.7 7.4 2.3 4 5.7 3.3c2-.4 4 .5 5.3 2.4 1.3-1.9 3.3-2.8 5.3-2.4 3.4.7 5 4.1 3.5 7.6-2.3 4.8-9.8 9.6-9.8 9.6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.7.44 3.35 1.28 4.8L2 22l5.42-1.36a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2Zm0 18.06h-.01a8.16 8.16 0 0 1-4.15-1.14l-.3-.18-3.08.78.83-3-.2-.3a8.13 8.13 0 0 1-1.25-4.3c0-4.49 3.66-8.15 8.16-8.15 2.18 0 4.22.85 5.76 2.4a8.09 8.09 0 0 1 2.39 5.76c0 4.49-3.66 8.13-8.15 8.13Zm4.47-6.1c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.39.11-.51.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function BottomNav({ whatsappNumber, t }: Props) {
  const wa = whatsappNumber ? whatsappLink(whatsappNumber) : "/contact";

  const items = [
    { href: "/", label: t["nav.home"], icon: <HomeIcon /> },
    { href: "/produits", label: t["nav.products"], icon: <ProductsIcon /> },
    { href: wa, label: "", icon: <WhatsAppIcon className="h-6 w-6 text-white" />, center: true, external: true },
    { href: "/contact", label: t["nav.contact"], icon: <ChatIcon /> },
    { href: "/wishlist", label: t["nav.wishlist"], icon: <HeartIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around border-t border-neutral-200 bg-white">
      {items.map((item) =>
        item.center ? (
          <a
            key={item.label || "whatsapp-center"}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red shadow-lg"
            aria-label="WhatsApp"
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
