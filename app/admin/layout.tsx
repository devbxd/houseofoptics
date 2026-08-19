import Link from "next/link";
import { signOut } from "./login/actions";
import { BackButton } from "./BackButton";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/model-photos", label: "Photos of models" },
  { href: "/admin/photos-en-masse", label: "Bulk Photo Upload" },
  { href: "/admin/produits", label: "Products" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/gift-cards", label: "Gift Cards" },
  { href: "/admin/hero", label: "Homepage" },
  { href: "/admin/footer", label: "End of page" },
  { href: "/admin/popups", label: "Pop-ups" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/theme", label: "Design" },
  { href: "/admin/police", label: "Font" },
  { href: "/admin/mode", label: "Mode" },
  { href: "/admin/reglages", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white p-4 md:block">
        <p className="mb-6 font-serif text-lg">Dashboard</p>
        <nav className="space-y-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-neutral-100">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-8">
          <button className="w-full rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100">
            Log out
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <MobileNav nav={NAV} signOut={signOut} />
        <main className="p-4 md:p-8">
          <BackButton />
          {children}
        </main>
      </div>
    </div>
  );
}
