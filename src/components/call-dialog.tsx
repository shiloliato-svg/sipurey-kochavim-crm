"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toWhatsAppNumber } from "@/lib/utils";

type CallTarget = { contactId: number; name: string; phone: string } | null;

type CallStatus = "connecting" | "ringing" | "in-call" | "ended" | "error";

export function useCallDialog() {
  const [target, setTarget] = useState<CallTarget>(null);
  return { target, setTarget };
}

export function CallDialog({
  target,
  onClose,
}: {
  target: CallTarget;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [error, setError] = useState("");
  const callRef = useRef<import("@twilio/voice-sdk").Call | null>(null);
  const deviceRef = useRef<import("@twilio/voice-sdk").Device | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;

    (async () => {
      setStatus("connecting");
      setError("");
      try {
        const { Device } = await import("@twilio/voice-sdk");
        const res = await fetch("/api/twilio/token");
        if (!res.ok) throw new Error("לא ניתן להתחבר לשירות הטלפוניה");
        const { token } = await res.json();
        if (cancelled) return;

        const device = new Device(token, { logLevel: "error" });
        deviceRef.current = device;

        const call = await device.connect({
          params: { To: `+${toWhatsAppNumber(target.phone)}` },
        });
        if (cancelled) {
          call.disconnect();
          return;
        }
        callRef.current = call;
        setStatus("ringing");

        call.on("accept", () => setStatus("in-call"));
        call.on("disconnect", () => setStatus("ended"));
        call.on("cancel", () => setStatus("ended"));
        call.on("reject", () => setStatus("ended"));
        call.on("error", () => setStatus("error"));

        await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: target.contactId, type: "call", note: "שיחה יזומה מה-CRM" }),
        });
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "שגיאה בהתחברות לשיחה");
        }
      }
    })();

    return () => {
      cancelled = true;
      callRef.current?.disconnect();
      deviceRef.current?.destroy();
      callRef.current = null;
      deviceRef.current = null;
    };
  }, [target]);

  const hangUp = () => {
    callRef.current?.disconnect();
  };

  const statusLabel: Record<CallStatus, string> = {
    connecting: "מתחבר...",
    ringing: "מצלצל...",
    "in-call": "בשיחה",
    ended: "השיחה הסתיימה",
    error: "שגיאה בשיחה",
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs" dir="rtl">
        <DialogHeader>
          <DialogTitle>שיחה עם {target?.name}</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4 space-y-4">
          <p className="text-sm text-gray-500">{statusLabel[status]}</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {(status === "ringing" || status === "in-call") && (
            <Button variant="destructive" onClick={hangUp} className="w-full">
              נתק
            </Button>
          )}
          {(status === "ended" || status === "error") && (
            <Button variant="outline" onClick={onClose} className="w-full">
              סגור
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
