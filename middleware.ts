import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  // Customer signups use this same auth.users table — app_metadata can
  // only ever be set server-side with the service-role key (never by a
  // user signing themselves up, see supabase/migrations/0049), so this is
  // what actually distinguishes the admin from any logged-in customer.
  const isAdmin = user?.app_metadata?.role === "admin";

  if (isAdminRoute && !isAdminLoginRoute && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isAdminLoginRoute && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Wishlist and gift cards need an account so they follow the customer
  // across devices instead of one browser's storage — checkout's own
  // >1-item gate lives client-side instead (it depends on cart contents,
  // which middleware can't see).
  const isAccountOnlyRoute =
    pathname === "/wishlist" || pathname === "/carte-cadeau" || (pathname.startsWith("/compte") && pathname !== "/compte/connexion" && pathname !== "/compte/inscription");

  if (isAccountOnlyRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isCustomerAuthRoute = pathname === "/compte/connexion" || pathname === "/compte/inscription";
  if (isCustomerAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/wishlist", "/carte-cadeau", "/compte/:path*"],
};
