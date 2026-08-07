import Link from "next/link";
import { signOut } from "./login/actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/produits", label: "Products" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/subscribers", label: "Subscribers" },
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
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <p className="font-serif">Dashboard</p>
          <form action={signOut}>
            <button className="text-sm text-neutral-600">Log out</button>
          </form>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2 text-sm md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-neutral-100">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
