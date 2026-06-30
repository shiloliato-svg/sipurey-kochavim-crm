import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
    include: { contact: { select: { name: true } }, deal: { select: { title: true } } },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, dueDate, contactId, dealId } = await req.json();
  const task = await prisma.task.create({
    data: {
      title,
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(contactId ? { contactId: Number(contactId) } : {}),
      ...(dealId ? { dealId: Number(dealId) } : {}),
    },
    include: { contact: { select: { name: true } }, deal: { select: { title: true } } },
  });
  return NextResponse.json(task, { status: 201 });
}
