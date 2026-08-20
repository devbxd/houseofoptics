"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  // Only ever redirect back into this site, never to an attacker-supplied
  // external URL passed through the ?next= param.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
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
    redirect(`/compte/inscription?error=${encodeURIComponent(error?.message ?? "Erreur d'inscription")}&next=${encodeURIComponent(next)}`);
  }

  const service = createServiceClient();
  await service.from("customer_profiles").insert({ id: data.user.id, name, phone: phone || null });

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
