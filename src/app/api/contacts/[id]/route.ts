import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id: Number(id) },
    include: { deals: true, tasks: true, activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!contact) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const contact = await prisma.contact.update({ where: { id: Number(id) }, data });
  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
