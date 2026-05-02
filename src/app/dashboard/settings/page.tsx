"use client";

import { useState, useEffect } from "react";
import { Store, CreditCard, Bell, Shield, Save, Check, Loader2 } from "lucide-react";

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "INR (₹)", value: "INR", symbol: "₹" },
  { label: "GBP (£)", value: "GBP", symbol: "£" },
];

type Settings = {
  storeName: string;
  contactEmail: string;
  currency: string;
  currencySymbol: string;
};

type SaveState = "idle" | "saving" | "saved";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    storeName: "LaundryOS Central",
    contactEmail: "hello@laundryos.com",
    currency: "USD",
    currencySymbol: "$",
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Load settings from DB on mount
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(s => ({ ...s, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCurrencyChange = (value: string) => {
    const option = CURRENCY_OPTIONS.find(c => c.value === value);
    setSettings(s => ({
      ...s,
      currency: value,
      currencySymbol: option?.symbol ?? "$",
    }));
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      alert("Failed to save settings.");
      setSaveState("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your business preferences. Changes are saved to the database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="space-y-1">
          <SidebarItem icon={<Store size={16} />} label="General" active />
          <SidebarItem icon={<CreditCard size={16} />} label="Payments" />
          <SidebarItem icon={<Bell size={16} />} label="Notifications" />
          <SidebarItem icon={<Shield size={16} />} label="Security" />
        </aside>

        {/* Form */}
        <div className="md:col-span-3 space-y-6">
          {/* Business Info */}
          <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Store Name">
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </Field>
              <Field label="Contact Email">
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={e => setSettings(s => ({ ...s, contactEmail: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </Field>
            </div>
          </section>

          {/* Currency */}
          <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4">Currency & Pricing</h3>
            <Field label="Display Currency">
              <div className="grid grid-cols-2 gap-3">
                {CURRENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleCurrencyChange(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      settings.currency === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <span className="text-lg">{opt.symbol}</span>
                    {opt.label}
                    {settings.currency === opt.value && <Check size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </Field>
            <p className="text-xs text-gray-400">
              Currency symbol <strong>{settings.currencySymbol}</strong> will appear across the dashboard, orders, and analytics.
            </p>
          </section>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveState !== "idle"}
              className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                saveState === "saved"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 text-white hover:bg-black disabled:opacity-60"
              }`}
            >
              {saveState === "saving" && <Loader2 size={16} className="animate-spin" />}
              {saveState === "saved" && <Check size={16} />}
              {saveState === "idle" && <Save size={16} />}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-100"
    }`}>
      {icon}
      {label}
    </button>
  );
}
