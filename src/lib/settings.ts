import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  storeName: "LaundryOS Central",
  contactEmail: "hello@laundryos.com",
  currency: "USD",
  currencySymbol: "$",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "INR (₹)", value: "INR", symbol: "₹" },
  { label: "GBP (£)", value: "GBP", symbol: "£" },
];
