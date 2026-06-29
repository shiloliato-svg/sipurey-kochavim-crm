import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { contact: { select: { name: true } } },
  });
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const deal = await prisma.deal.create({
    data,
    include: { contact: { select: { name: true } } },
  });
  return NextResponse.json(deal, { status: 201 });
}
