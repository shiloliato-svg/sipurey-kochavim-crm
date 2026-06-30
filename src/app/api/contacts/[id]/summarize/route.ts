import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id: Number(id) },
    include: {
      activities: {
        where: { type: "whatsapp" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contact) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const messages = contact.activities;
  if (messages.length === 0) {
    return NextResponse.json({ error: "אין הודעות וואטספ לליד זה" }, { status: 400 });
  }

  const conversation = messages
    .map((a) => `[${new Date(a.createdAt).toLocaleDateString("he-IL")}] ${a.note}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `נתח את שיחת הוואטספ הבאה עם הלקוח "${contact.name}" והחזר JSON בלבד (ללא טקסט נוסף) בפורמט הבא:
{
  "summary": "סיכום של 2-3 משפטים: מה הלקוח רצה, מה הוסכם, מה הצעד הבא",
  "bookCount": "מספר הספרים שהלקוח מעוניין לרכוש — החזר אחד מהערכים: 1, 2, 3, 4, 5+ — אם לא ברור החזר null",
  "leadState": "מילה אחת או שתיים שמתארות את מצב הליד לפי השיחה. דוגמאות: מעוניין, מתלבט, לא רלוונטי, ממתין לתשלום, שולם, לא ענה, בודק פרטים, חם מאוד"
}

שיחה:
${conversation}`,
      },
    ],
  });

  const text = (response.content[0] as { type: string; text: string }).text;

  let summary = text;
  let bookCount: string | null = null;
  let leadState: string | null = null;

  try {
    const parsed = JSON.parse(text);
    summary = parsed.summary ?? text;
    bookCount = parsed.bookCount ?? null;
    leadState = parsed.leadState ?? null;
  } catch {
    // fallback: treat whole response as summary
  }

  await prisma.contact.update({
    where: { id: Number(id) },
    data: {
      whatsappSummary: summary,
      ...(bookCount ? { bookCount } : {}),
      ...(leadState ? { leadState } : {}),
    },
  });

  return NextResponse.json({ summary, bookCount, leadState });
}
