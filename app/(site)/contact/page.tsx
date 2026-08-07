import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";
import { SocialIcons } from "@/components/SocialIcons";

export default async function ContactPage() {
  const [settings, { t }] = await Promise.all([getSiteSettings(), getServerDict()]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-serif text-2xl">{t["contact.title"]}</h1>
      <p className="mt-3 text-neutral-600">{t["contact.subtitle"]}</p>

      <div className="mt-10 space-y-4">
        {settings.contact_email && (
          <a href={`mailto:${settings.contact_email}`} className="block border border-neutral-300 py-3 hover:border-brand-black">
            {settings.contact_email}
          </a>
        )}
        {settings.whatsapp_number && (
          <a
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-green-600 py-3 text-white hover:opacity-90"
          >
            {t["nav.whatsapp"]}
          </a>
        )}
        {settings.instagram_handle && (
          <a
            href={`https://instagram.com/${settings.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-neutral-300 py-3 hover:border-brand-black"
          >
            @{settings.instagram_handle}
          </a>
        )}
      </div>

      <SocialIcons
        className="mt-10 flex items-center justify-center gap-6"
        whatsappUrl={settings.whatsapp_number ? whatsappLink(settings.whatsapp_number) : ""}
        facebookUrl={settings.facebook_url}
        instagramUrl={settings.instagram_handle ? `https://instagram.com/${settings.instagram_handle}` : ""}
      />
    </main>
  );
}
