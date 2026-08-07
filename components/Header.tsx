import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HamburgerMenu } from "./HamburgerMenu";
import { SocialIcons } from "./SocialIcons";
import { whatsappLink } from "@/lib/settings";
import type { Locale } from "@/lib/i18n";

type Category = { id: string; name: string; slug: string };

type Props = {
  brandName: string;
  categories: Category[];
  locale: Locale;
  t: Record<string, string>;
  whatsappNumber: string;
  facebookUrl: string;
  instagramHandle: string;
  contactEmail: string;
};

export function Header({ brandName, categories, t, whatsappNumber, facebookUrl, instagramHandle, contactEmail }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-brand-black bg-brand-black py-2 text-center text-[11px] uppercase tracking-[0.2em] text-white">
        {t["nav.announcement"]}
      </div>
      <div className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6 md:py-5">
          <HamburgerMenu
            categories={categories}
            whatsappUrl={whatsappNumber ? whatsappLink(whatsappNumber) : ""}
            facebookUrl={facebookUrl}
            instagramUrl={instagramHandle ? `https://instagram.com/${instagramHandle}` : ""}
            mailUrl={contactEmail ? `mailto:${contactEmail}` : ""}
            t={t}
          />

          <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 md:gap-2.5">
            <Image
              src="/logo-mark.png"
              alt=""
              width={55}
              height={66}
              className="h-6 w-auto shrink-0 object-contain invert md:h-9"
              priority
            />
            <span className="truncate font-serif text-base tracking-[0.1em] text-brand-black md:text-2xl md:tracking-[0.15em]">
              {brandName.toUpperCase()}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 md:gap-6">
            <nav className="hidden items-center gap-10 text-xs uppercase tracking-[0.15em] md:flex">
              <Link href="/" className="transition-colors hover:text-brand-red">
                {t["nav.home"]}
              </Link>

              <div className="group relative py-2">
                <button className="flex items-center gap-1.5 transition-colors hover:text-brand-red">
                  {t["nav.products"]}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                    <path d="M5 7l5 5 5-5H5z" />
                  </svg>
                </button>
                <div className="invisible absolute left-1/2 top-full min-w-[14rem] -translate-x-1/2 rounded-sm border border-neutral-200 bg-white py-2 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100">
                  <Link href="/produits" className="block px-5 py-2.5 normal-case tracking-normal hover:bg-neutral-50">
                    {t["nav.allProducts"]}
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/categorie/${c.slug}`}
                      className="block px-5 py-2.5 normal-case tracking-normal hover:bg-neutral-50"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/contact" className="transition-colors hover:text-brand-red">
                {t["nav.contact"]}
              </Link>
            </nav>

            <SocialIcons
              className="hidden items-center gap-4 border-l border-neutral-200 pl-6 md:flex"
              whatsappUrl={whatsappNumber ? whatsappLink(whatsappNumber) : ""}
              facebookUrl={facebookUrl}
              instagramUrl={instagramHandle ? `https://instagram.com/${instagramHandle}` : ""}
            />

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
