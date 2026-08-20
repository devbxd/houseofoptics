import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { GiftCardProvider } from "@/components/GiftCardProvider";
import { CustomerAuthProvider } from "@/components/CustomerAuthProvider";
import { CartFab } from "@/components/CartFab";
import { GiftCardReminder } from "@/components/GiftCardReminder";
import { PageViewTracker } from "@/components/PageViewTracker";
import { SiteModeOverlay } from "@/components/site-mode/SiteModeOverlay";
import { PromoPopup } from "@/components/PromoPopup";
import { SpinWheelPopup } from "@/components/SpinWheelPopup";
import { BackButton } from "@/components/BackButton";
import { getSiteSettings, getCategories, whatsappLink } from "@/lib/settings";
import { getServerDict } from "@/lib/locale-server";
import { getActivePopup } from "@/lib/popups";
import { getFooterSections } from "@/lib/footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, { locale, t }, activePopup, normalizedFooterSections] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getServerDict(),
    getActivePopup(),
    getFooterSections(),
  ]);

  return (
    <CustomerAuthProvider>
    <WishlistProvider>
      <CartProvider>
        <GiftCardProvider>
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
            logoUrl={settings.logo_url}
            announcementText={settings.announcement_text}
            bannerColor={settings.banner_color}
          />
          {settings.active_mode && <SiteModeOverlay mode={settings.active_mode} t={t} />}
          <BackButton label={t["nav.back"]} />
          {children}
          <Footer
            brandName={settings.brand_name}
            sections={normalizedFooterSections}
            facebookUrl={settings.facebook_url}
            instagramUrl={settings.instagram_handle ? `https://instagram.com/${settings.instagram_handle}` : ""}
            whatsappUrl={settings.whatsapp_number ? whatsappLink(settings.whatsapp_number) : ""}
            emailUrl={settings.contact_email ? `mailto:${settings.contact_email}` : ""}
            copyrightText={settings.footer_copyright_text}
          />
          {settings.spin_wheel_enabled ? (
            <SpinWheelPopup brandName={settings.brand_name} />
          ) : (
            activePopup && <PromoPopup popup={activePopup} />
          )}
          <CartFab />
          <GiftCardReminder t={t} />
          <BottomNav whatsappNumber={settings.whatsapp_number} t={t} />
        </GiftCardProvider>
      </CartProvider>
    </WishlistProvider>
    </CustomerAuthProvider>
  );
}
