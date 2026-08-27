import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { contactId, type, note } = await req.json();

  if (!contactId || !type || !note) {
    return NextResponse.json({ error: "חסרים שדות" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: { contactId: Number(contactId), type, note },
  });

  return NextResponse.json(activity, { status: 201 });
}
