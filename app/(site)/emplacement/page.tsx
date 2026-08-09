import type { Metadata } from "next";
import { getSiteSettings, mapEmbedUrl, mapDirectionsUrl, localizedShopDescription } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "Notre boutique",
  description: "Retrouvez House of Optics à Furn El Chebbak, Liban.",
};

export default async function LocationPage() {
  const [settings, { t, locale }] = await Promise.all([getSiteSettings(), getServerDict()]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-serif text-2xl">{t["location.title"]}</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-neutral-600">
        {localizedShopDescription(settings, locale)}
      </p>

      <div className="mt-8 aspect-[4/3] w-full overflow-hidden rounded-md border border-neutral-200 sm:aspect-video">
        <iframe
          src={mapEmbedUrl(settings.shop_address)}
          title={t["location.title"]}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="mt-4 text-sm text-neutral-500">{settings.shop_address}</p>

      <a
        href={mapDirectionsUrl(settings.shop_address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block border border-brand-black px-8 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-brand-black hover:text-white"
      >
        {t["location.openMaps"]}
      </a>
    </main>
  );
}
