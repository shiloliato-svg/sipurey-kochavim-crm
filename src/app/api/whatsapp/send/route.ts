import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toWhatsAppNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { contactId, phone, message } = await req.json();

  if (!phone || !message?.trim()) {
    return NextResponse.json({ error: "חסר טלפון או הודעה" }, { status: 400 });
  }

  const { GREEN_API_URL, GREEN_API_INSTANCE, GREEN_API_TOKEN } = process.env;
  if (!GREEN_API_URL || !GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
    return NextResponse.json({ error: "חיבור הוואטסאפ לא מוגדר בשרת" }, { status: 500 });
  }

  const chatId = `${toWhatsAppNumber(phone)}@c.us`;
  // מסיר variation selectors (U+FE0F) - נצפתה בעיה שבה אימוג'ים מורכבים (כמו ❤️)
  // הופכים לריבוע/תו לא מזוהה אצל הנמען כשהם נשלחים דרך Green API עם ה-selector.
  const cleanMessage = message.normalize("NFC").replace(/️/g, "");

  const res = await fetch(
    `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ chatId, message: cleanMessage }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "שליחת ההודעה נכשלה" }, { status: 502 });
  }

  if (contactId) {
    await prisma.activity.create({
      data: { type: "whatsapp", note: cleanMessage, contactId: Number(contactId) },
    });
  }

  return NextResponse.json({ ok: true });
}
