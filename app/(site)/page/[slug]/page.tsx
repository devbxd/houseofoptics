import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("title").eq("slug", slug).single();
  return { title: data?.title ?? "Page" };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("title, body").eq("slug", slug).single();

  if (!data) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-2xl">{data.title}</h1>
      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{data.body}</p>
    </main>
  );
}
