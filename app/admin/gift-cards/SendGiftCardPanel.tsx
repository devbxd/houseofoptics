"use client";

import { useEffect, useMemo, useState } from "react";
import { listCustomersForPicker, sendGiftCardByEmail, type CustomerOption } from "./actions";

function waLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Lets the admin hand the code over directly from the dashboard — either
// by picking a customer who already has an account, or by typing an email
// / phone number straight in for someone who doesn't yet.
export function SendGiftCardPanel({ code, summary }: { code: string; summary: string }) {
  const [mode, setMode] = useState<"email" | "whatsapp" | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[] | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (mode && customers === null) {
      listCustomersForPicker().then(setCustomers);
    }
  }, [mode, customers]);

  const filtered = useMemo(() => {
    if (!customers || !inputValue.trim()) return [];
    const q = inputValue.trim().toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 6);
  }, [customers, inputValue]);

  function pick(c: CustomerOption) {
    setSelectedId(c.id);
    setInputValue(mode === "email" ? c.email : c.phone ?? "");
    setShowSuggestions(false);
  }

  function switchMode(next: "email" | "whatsapp") {
    setMode(next);
    setSelectedId(null);
    setInputValue("");
    setResult(null);
  }

  async function handleSendEmail() {
    const email = inputValue.trim();
    if (!email) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendGiftCardByEmail(code, email);
      setResult(res.ok ? { ok: true, message: `Sent to ${email} ✓` } : { ok: false, message: res.error ?? "Failed to send" });
    } finally {
      setSending(false);
    }
  }

  const whatsappMessage = `Hi! You've received a gift from House of Optics — ${summary}. Redeem it at houseofoptics.net/carte-cadeau with the code: ${code}`;

  return (
    <div className="mt-4 rounded-md border border-neutral-200 bg-white p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Send this gift</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("email")}
          className={`flex-1 border py-2 text-xs uppercase tracking-wide ${mode === "email" ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-black"}`}
        >
          By Email
        </button>
        <button
          type="button"
          onClick={() => switchMode("whatsapp")}
          className={`flex-1 border py-2 text-xs uppercase tracking-wide ${mode === "whatsapp" ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-black"}`}
        >
          By WhatsApp
        </button>
      </div>

      {mode && (
        <div className="mt-3 space-y-2">
          <div className="relative">
            <input
              type={mode === "email" ? "email" : "tel"}
              value={inputValue}
              onChange={(e) => {
                setSelectedId(null);
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={
                mode === "email" ? "Search a customer, or type an email directly" : "Search a customer, or type a phone number directly"
              }
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
            {showSuggestions && !selectedId && filtered.length > 0 && (
              <div className="absolute z-10 mt-1 w-full border border-neutral-200 bg-white shadow-md">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => pick(c)}
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-neutral-50"
                  >
                    <span className="font-medium">{c.name}</span> — {mode === "email" ? c.email : c.phone || "no phone on file"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {mode === "email" ? (
            <button
              type="button"
              disabled={sending || !inputValue.trim()}
              onClick={handleSendEmail}
              className="w-full bg-brand-black py-2.5 text-xs uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {sending ? "Sending..." : "Send email"}
            </button>
          ) : (
            <a
              href={inputValue.trim() ? waLink(inputValue, whatsappMessage) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!inputValue.trim()) e.preventDefault();
              }}
              className={`block w-full py-2.5 text-center text-xs uppercase tracking-wide text-white ${
                inputValue.trim() ? "bg-green-600 hover:opacity-90" : "cursor-not-allowed bg-neutral-300"
              }`}
            >
              Open WhatsApp
            </a>
          )}

          {result && <p className={`text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.message}</p>}
        </div>
      )}
    </div>
  );
}
