import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const to = form.get("To")?.toString();

  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();

  if (to) {
    const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
    dial.number(to);
  } else {
    response.say({ language: "he-IL" }, "מספר יעד חסר");
  }

  return new NextResponse(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
