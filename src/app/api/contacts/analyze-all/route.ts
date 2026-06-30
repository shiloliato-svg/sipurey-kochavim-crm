import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  const contacts = await prisma.contact.findMany({
    include: {
      activities: {
        where: { type: "whatsapp" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const withMessages = contacts.filter((c) => c.activities.length > 0);

  const results: { id: number; leadState: string }[] = [];

  for (const contact of withMessages) {
    const conversation = contact.activities
      .map((a) => `[${new Date(a.createdAt).toLocaleDateString("he-IL")}] ${a.note}`)
      .join("\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: `בהתבסס על שיחת הוואטספ הזו עם הלקוח, כתוב מילה אחת או שתיים שמתארות את הסיכוי לסגירה/מכירה.
דוגמאות: מעוניין, חם מאוד, מתלבט, בודק פרטים, ממתין לתשלום, שולם, לא רלוונטי, לא ענה, קר.
החזר רק את המילה/ות, ללא הסברים.

שיחה:
${conversation}`,
          },
        ],
      });

      const leadState = (response.content[0] as { text: string }).text.trim();

      await prisma.contact.update({
        where: { id: contact.id },
        data: { leadState },
      });

      results.push({ id: contact.id, leadState });
    } catch {
      // skip contact on error
    }
  }

  return NextResponse.json({ updated: results.length, results });
}
