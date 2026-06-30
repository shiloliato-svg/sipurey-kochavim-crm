import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CAMPAIGN_MESSAGES = [
  "שלום! אני מעוניין בספר אסטרולוגי אישי",
  "שלום! אני מעוניינת בספר אסטרולוגי אישי",
];

function detectLeadSource(message: string): string | null {
  const trimmed = message.trim();
  if (CAMPAIGN_MESSAGES.includes(trimmed)) return "קמפיין ממומן";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.typeWebhook !== "incomingMessageReceived") {
    return NextResponse.json({ ok: true });
  }

  const sender = body.senderData;
  if (!sender) return NextResponse.json({ ok: true });

  const phone = sender.sender?.replace("@c.us", "") ?? "";
  const name = sender.senderName ?? phone;
  const message = body.messageData?.textMessageData?.textMessage ?? "";

  if (!phone) return NextResponse.json({ ok: true });

  const leadSource = detectLeadSource(message);

  let contact = await prisma.contact.findFirst({ where: { phone } });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name,
        phone,
        notes: "נוסף אוטומטית מוואטספ",
        ...(leadSource ? { leadSource } : {}),
      },
    });
  } else if (leadSource && !contact.leadSource) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { leadSource },
    });
  }

  await prisma.activity.create({
    data: {
      type: "whatsapp",
      note: message || "(הודעה)",
      contactId: contact.id,
    },
  });

  return NextResponse.json({ ok: true });
}
