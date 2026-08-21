import { getSiteSettings, localizedSpecialRequestText } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";
import { SpecialRequestForm } from "./SpecialRequestForm";

export default async function SpecialRequestPage() {
  const [settings, { locale, t }] = await Promise.all([getSiteSettings(), getServerDict()]);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-center font-serif text-2xl">{settings.special_request_title || t["specialRequest.title"]}</h1>
      <p className="mt-3 whitespace-pre-line text-center text-sm text-neutral-600">
        {localizedSpecialRequestText(settings, locale)}
      </p>

      <SpecialRequestForm whatsappNumber={settings.whatsapp_number} t={t} />
    </main>
  );
}
