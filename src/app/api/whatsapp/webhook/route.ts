import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.typeWebhook !== "incomingMessageReceived") {
    return NextResponse.json({ ok: true });
  }

  const sender = body.senderData;
  if (!sender) return NextResponse.json({ ok: true });

  const phone = sender.sender?.replace("@c.us", "") ?? "";
  const name = sender.senderName ?? phone;

  if (!phone) return NextResponse.json({ ok: true });

  const existing = await prisma.contact.findFirst({
    where: { phone },
  });

  if (!existing) {
    await prisma.contact.create({
      data: {
        name,
        phone,
        notes: "נוסף אוטומטית מוואטספ",
      },
    });
  }

  await prisma.activity.create({
    data: {
      type: "whatsapp",
      note: body.messageData?.textMessageData?.textMessage ?? "(הודעה)",
      contactId: existing?.id ?? (
        await prisma.contact.findFirst({ where: { phone } })
      )?.id,
    },
  });

  return NextResponse.json({ ok: true });
}
