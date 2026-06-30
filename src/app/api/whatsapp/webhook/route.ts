import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CAMPAIGN_MESSAGES = [
  "שלום! אני מעוניין בספר אסטרולוגי אישי",
  "שלום! אני מעוניינת בספר אסטרולוגי אישי",
];

function detectLeadSource(message: string): string | null {
  const trimmed = message.trim();
  if (CAMPAIGN_MESSAGES.includes(trimmed)) return "קמפיין ממומן";
  return null;
}

async function detectBookCount(contactId: number): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      activities: {
        where: { type: "whatsapp" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contact || contact.activities.length === 0) return;

  const conversation = contact.activities
    .map((a) => a.note)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: `מתוך השיחה הזו, כמה ספרים הלקוח רוצה לרכוש? החזר רק מספר אחד מהאפשרויות: 1, 2, 3, 4, 5+ — או null אם לא ברור.

שיחה:
${conversation}`,
        },
      ],
    });

    const result = (response.content[0] as { text: string }).text.trim();
    const valid = ["1", "2", "3", "4", "5+"];
    if (valid.includes(result)) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { bookCount: result },
      });
    }
  } catch {
    // silent fail
  }
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

  // Analyze book count in background (non-blocking)
  detectBookCount(contact.id).catch(() => {});

  // Forward to the bot so it continues to handle the conversation
  const botUrl = process.env.BOT_WEBHOOK_URL;
  if (botUrl) {
    fetch(botUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
