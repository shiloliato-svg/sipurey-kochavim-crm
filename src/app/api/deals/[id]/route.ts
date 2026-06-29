import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const deal = await prisma.deal.update({
    where: { id: Number(id) },
    data,
    include: { contact: { select: { name: true } } },
  });
  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
