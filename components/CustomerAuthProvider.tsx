"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type CustomerAuthContextValue = {
  user: User | null;
  name: string | null;
  loading: boolean;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

// Reactive client-side auth state (login/logout without a full page
// reload) for gating things like the wishlist button and the >1-item
// checkout requirement — the actual security boundary for pages that must
// never render for a logged-out visitor is middleware.ts, which runs
// server-side before any of this ever reaches the browser.
export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setName((data.user?.user_metadata?.name as string | undefined) ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setName((session?.user?.user_metadata?.name as string | undefined) ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, name, loading }), [user, name, loading]);

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
