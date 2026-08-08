import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { CartFab } from "@/components/CartFab";
import { PageViewTracker } from "@/components/PageViewTracker";
import { SiteModeOverlay } from "@/components/site-mode/SiteModeOverlay";
import { getSiteSettings, getCategories } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, { locale, t }] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getServerDict(),
  ]);

  return (
    <WishlistProvider>
      <CartProvider>
        <PageViewTracker />
        <Header
          brandName={settings.brand_name}
          categories={categories}
          locale={locale}
          t={t}
          whatsappNumber={settings.whatsapp_number}
          facebookUrl={settings.facebook_url}
          instagramHandle={settings.instagram_handle}
          contactEmail={settings.contact_email}
        />
        {settings.active_mode && <SiteModeOverlay mode={settings.active_mode} />}
        {children}
        <CartFab />
        <BottomNav whatsappNumber={settings.whatsapp_number} contactEmail={settings.contact_email} t={t} />
      </CartProvider>
    </WishlistProvider>
  );
}
