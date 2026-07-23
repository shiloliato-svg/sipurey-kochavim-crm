"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Deal = {
  id: number;
  title: string;
  value?: number;
  stage: string;
  notes?: string;
  contactId: number;
  contact: { name: string };
  createdAt: string;
};

type Contact = { id: number; name: string };

const STAGES = ["ליד", "פגישה ראשונה", "הצעת מחיר", "משא ומתן", "סגירה", "בוטל"];

const STAGE_COLORS: Record<string, string> = {
  "ליד": "bg-blue-100 text-blue-800",
  "פגישה ראשונה": "bg-yellow-100 text-yellow-800",
  "הצעת מחיר": "bg-orange-100 text-orange-800",
  "משא ומתן": "bg-purple-100 text-purple-800",
  "סגירה": "bg-green-100 text-green-800",
  "בוטל": "bg-gray-100 text-gray-500",
};

const empty = { title: "", value: "", stage: "ליד", notes: "", contactId: "" };

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [d, c] = await Promise.all([
      fetch("/api/deals").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]);
    setDeals(d);
    setContacts(c);
  };

  useEffect(() => { load(); }, []);

  const byStage = (stage: string) => deals.filter((d) => d.stage === stage);

  const totalValue = (stage: string) =>
    byStage(stage).reduce((s, d) => s + (d.value ?? 0), 0);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Deal) => {
    setEditing(d);
    setForm({ title: d.title, value: d.value?.toString() ?? "", stage: d.stage, notes: d.notes ?? "", contactId: d.contactId.toString() });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.contactId) return;
    const payload = {
      title: form.title,
      value: form.value ? Number(form.value) : null,
      stage: form.stage,
      notes: form.notes || null,
      contactId: Number(form.contactId),
    };
    if (editing) {
      await fetch(`/api/deals/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setOpen(false);
    load();
  };

  const moveStage = async (deal: Deal, stage: string) => {
    await fetch(`/api/deals/${deal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("למחוק עסקה זו?")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">צינור עסקאות</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} />}>
            + עסקה חדשה
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing ? "עריכת עסקה" : "עסקה חדשה"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>כותרת *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="תיאור העסקה" />
              </div>
              <div>
                <Label>לקוח *</Label>
                <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>שלב</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v ?? "ליד" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ערך (₪)</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>הערות</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <Button onClick={save} className="w-full">{editing ? "שמור שינויים" : "הוסף עסקה"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {deals.length === 0 && contacts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💼</p>
          <p>הוסף קודם איש קשר, ואז תוכל ליצור עסקאות</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.filter(s => s !== "בוטל").map((stage) => (
            <div key={stage} className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="font-semibold text-sm">{stage}</span>
                  <div className="flex items-center gap-2">
                    {totalValue(stage) > 0 && (
                      <span className="text-xs text-gray-500">₪{totalValue(stage).toLocaleString()}</span>
                    )}
                    <Badge variant="secondary" className="text-xs">{byStage(stage).length}</Badge>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-32">
                  {byStage(stage).map((deal) => (
                    <div key={deal.id} className="bg-gray-50 rounded-md p-3 border hover:border-purple-300 transition-colors">
                      <p className="font-medium text-sm mb-1">{deal.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{deal.contact.name}</p>
                      {deal.value && (
                        <p className="text-xs font-semibold text-green-700 mb-2">₪{deal.value.toLocaleString()}</p>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {STAGES.filter(s => s !== stage).map((s) => (
                          <button
                            key={s}
                            onClick={() => moveStage(deal, s)}
                            className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[s]} hover:opacity-80 transition-opacity`}
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => openEdit(deal)} className="text-xs text-blue-600 hover:underline">עריכה</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => remove(deal.id)} className="text-xs text-red-500 hover:underline">מחיקה</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {byStage("בוטל").length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">עסקאות שבוטלו</h2>
          <div className="flex flex-wrap gap-2">
            {byStage("בוטל").map((deal) => (
              <div key={deal.id} className="bg-gray-100 rounded px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <span>{deal.title} — {deal.contact.name}</span>
                <button onClick={() => remove(deal.id)} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
