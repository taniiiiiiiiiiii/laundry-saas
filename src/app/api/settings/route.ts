import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULTS: Record<string, string> = {
  storeName: "LaundryOS Central",
  contactEmail: "hello@laundryos.com",
  currency: "USD",
  currencySymbol: "$",
  expressMultiplier: "1.5",
  standardDays: "2",
  expressDays: "0.25",
};

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const entries = Object.entries(body as Record<string, string>);
  
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
