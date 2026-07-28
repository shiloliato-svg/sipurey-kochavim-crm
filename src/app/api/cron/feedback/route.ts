import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const FEEDBACK_DELAY_DAYS = 10;

function feedbackMessage(name: string) {
  return `היי ${name}, מקווים שנהנית מהספר! נשמח מאוד לשמוע פידבק קצר על התוצאה הסופית - זה עוזר לנו המון :)`;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - FEEDBACK_DELAY_DAYS * 24 * 60 * 60 * 1000);

  const contacts = await prisma.contact.findMany({
    where: {
      status: "סגור",
      closedAt: { lte: cutoff },
      feedbackRequestedAt: null,
      phone: { not: null },
    },
  });

  const results: { contactId: number; sent: boolean }[] = [];

  for (const contact of contacts) {
    const { ok, cleanMessage } = await sendWhatsAppMessage(contact.phone!, feedbackMessage(contact.name));

    if (ok) {
      await prisma.activity.create({
        data: { type: "whatsapp", note: cleanMessage, contactId: contact.id },
      });
      await prisma.contact.update({
        where: { id: contact.id },
        data: { feedbackRequestedAt: new Date() },
      });
    }

    results.push({ contactId: contact.id, sent: ok });
  }

  return NextResponse.json({ checked: contacts.length, results });
}
