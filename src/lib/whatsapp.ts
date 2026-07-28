import { toWhatsAppNumber } from "@/lib/utils";

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ ok: boolean; cleanMessage: string }> {
  // מסיר variation selectors (U+FE0F) - נצפתה בעיה שבה אימוג'ים מורכבים (כמו ❤️)
  // הופכים לריבוע/תו לא מזוהה אצל הנמען כשהם נשלחים דרך Green API עם ה-selector.
  const cleanMessage = message.normalize("NFC").replace(/️/g, "");

  const { GREEN_API_URL, GREEN_API_INSTANCE, GREEN_API_TOKEN } = process.env;
  if (!GREEN_API_URL || !GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
    return { ok: false, cleanMessage };
  }

  const chatId = `${toWhatsAppNumber(phone)}@c.us`;
  const res = await fetch(
    `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ chatId, message: cleanMessage }),
    }
  );

  return { ok: res.ok, cleanMessage };
}
