"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  // Only ever redirect back into this site, never to an attacker-supplied
  // external URL passed through the ?next= param.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
}

// Supabase's own error.message is always in English, regardless of the
// site's locale, and sometimes reads as raw technical text ("email rate
// limit exceeded") — never shown to a customer as-is. Known cases get a
// clear French message; anything unrecognized falls back to a generic one
// rather than leaking Supabase's wording.
function friendlySignUpError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("rate limit")) return "Trop de tentatives pour le moment — réessaie dans quelques minutes.";
  if (m.includes("already registered") || m.includes("already exists")) {
    return "Un compte existe déjà avec cet email — connecte-toi à la place.";
  }
  if (m.includes("password")) return "Mot de passe invalide — 6 caractères minimum.";
  if (m.includes("email")) return "Adresse email invalide.";
  return "Erreur d'inscription — réessaie dans quelques instants.";
}

export async function signUpCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!name || !email || !password) {
    redirect(`/compte/inscription?error=${encodeURIComponent("Tous les champs sont requis")}&next=${encodeURIComponent(next)}`);
  }
  if (password.length < 6) {
    redirect(`/compte/inscription?error=${encodeURIComponent("Le mot de passe doit contenir au moins 6 caractères")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });

  if (error || !data.user) {
    redirect(`/compte/inscription?error=${encodeURIComponent(friendlySignUpError(error?.message))}&next=${encodeURIComponent(next)}`);
  }

  // Supabase deliberately doesn't return an error for an email that's
  // already registered (anti-enumeration — it would let an attacker probe
  // which emails have accounts) — it returns 200 with a user object but an
  // *empty* identities array, since no new identity was actually created.
  // That's the one reliable way to tell "this just silently matched an
  // existing account" apart from a genuine new signup.
  if (data.user.identities && data.user.identities.length === 0) {
    redirect(
      `/compte/connexion?error=${encodeURIComponent("Un compte existe déjà avec cet email — connecte-toi.")}&next=${encodeURIComponent(next)}`
    );
  }

  // customer_profiles is now created automatically by a database trigger on
  // auth.users (see supabase/migrations/0050) — inserting it here too used
  // to race the new auth.users row becoming visible to this follow-up
  // call and intermittently fail with a foreign key violation.
  const service = createServiceClient();

  // Anything they ordered as a guest with this same email, before creating
  // an account, becomes visible in their new account too — nothing about
  // their history is lost just because they didn't have an account yet.
  await service.from("orders").update({ customer_id: data.user.id }).eq("customer_email", email).is("customer_id", null);

  // Email confirmation may be required depending on the Supabase project's
  // auth settings — if so there's no session yet and redirecting into a
  // protected page would just bounce them straight back to login.
  if (!data.session) {
    redirect(`/compte/inscription?pending=1&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signInCustomer(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    redirect(`/compte/connexion?error=${encodeURIComponent("Email et mot de passe requis")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/compte/connexion?error=${encodeURIComponent("Email ou mot de passe incorrect")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
