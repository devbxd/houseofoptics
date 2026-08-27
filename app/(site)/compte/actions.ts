"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

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
// Returns a short code, translated by the page component via t[] — never a
// hardcoded-language sentence, since Supabase's own error.message is always
// English regardless of the site's locale (fr/en/ar).
function friendlySignUpError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("rate limit")) return "RATE_LIMIT";
  if (m.includes("already registered") || m.includes("already exists")) return "EMAIL_TAKEN";
  if (m.includes("password")) return "INVALID_PASSWORD";
  if (m.includes("email")) return "INVALID_EMAIL";
  return "SIGNUP_ERROR";
}

export async function signUpCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!name || !email || !password) {
    redirect(`/compte/inscription?error=${encodeURIComponent("MISSING_FIELDS")}&next=${encodeURIComponent(next)}`);
  }
  if (password.length < 6) {
    redirect(`/compte/inscription?error=${encodeURIComponent("PASSWORD_TOO_SHORT")}&next=${encodeURIComponent(next)}`);
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
      `/compte/connexion?error=${encodeURIComponent("EMAIL_TAKEN")}&next=${encodeURIComponent(next)}`
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
    redirect(`/compte/connexion?error=${encodeURIComponent("MISSING_CREDENTIALS")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/compte/connexion?error=${encodeURIComponent("INVALID_CREDENTIALS")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`/compte/mot-de-passe-oublie?error=${encodeURIComponent("EMAIL_REQUIRED")}`);

  const supabase = await createClient();
  // Never reveal whether the email exists (anti-enumeration) — always show
  // the same "check your inbox" outcome regardless of what Supabase says.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/compte/reinitialiser` });
  redirect("/compte/mot-de-passe-oublie?sent=1");
}

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    redirect(`/compte/reinitialiser?error=${encodeURIComponent("PASSWORD_TOO_SHORT")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/compte/reinitialiser?error=${encodeURIComponent("RESET_LINK_EXPIRED")}`);
  }
  redirect("/compte?reset=1");
}

export async function updateProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const service = createServiceClient();
  await service.from("customer_profiles").update({ name: name || user.email, phone: phone || null }).eq("id", user.id);
  redirect("/compte");
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
