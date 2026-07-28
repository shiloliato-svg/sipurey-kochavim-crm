import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  if (data.status !== undefined) {
    const current = await prisma.contact.findUnique({ where: { id: Number(id) }, select: { status: true } });
    if (data.status === "סגור" && current?.status !== "סגור") {
      // נכנס לסטטוס סגור - מתחילים למנות 10 ימים עד הודעת פידבק אוטומטית
      data.closedAt = new Date();
      data.feedbackRequestedAt = null;
    } else if (data.status !== "סגור" && current?.status === "סגור") {
      data.closedAt = null;
      data.feedbackRequestedAt = null;
    }
  }

  const contact = await prisma.contact.update({ where: { id: Number(id) }, data });
  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
