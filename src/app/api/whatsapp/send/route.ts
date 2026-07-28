import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const { contactId, phone, message } = await req.json();

  if (!phone || !message?.trim()) {
    return NextResponse.json({ error: "חסר טלפון או הודעה" }, { status: 400 });
  }

  const { ok, cleanMessage } = await sendWhatsAppMessage(phone, message);

  if (!ok) {
    return NextResponse.json({ error: "שליחת ההודעה נכשלה" }, { status: 502 });
  }

  if (contactId) {
    await prisma.activity.create({
      data: { type: "whatsapp", note: cleanMessage, contactId: Number(contactId) },
    });
    await prisma.contact.update({
      where: { id: Number(contactId) },
      data: { lastFollowUpAt: new Date(), lastFollowUpMessage: cleanMessage },
    });
  }

  return NextResponse.json({ ok: true });
}
