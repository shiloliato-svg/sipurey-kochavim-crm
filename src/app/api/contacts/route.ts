import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          deals: true,
          tasks: true,
          activities: { where: { type: "whatsapp" } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { note: true, createdAt: true, type: true },
      },
    },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const contact = await prisma.contact.create({ data });
  return NextResponse.json(contact, { status: 201 });
}
