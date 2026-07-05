"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toWhatsAppNumber } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
  contactId?: number;
  contact?: { id: number; name: string; phone?: string | null };
  dealId?: number;
  deal?: { title: string };
};

type Contact = { id: number; name: string };

const empty = { title: "", dueDate: "", contactId: "", dealId: "" };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function dueDateLabel(dueDate: string): { text: string; tone: "overdue" | "today" | "soon" | "later" } {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = new Date(dueDate).toLocaleDateString("he-IL", { day: "numeric", month: "short" });

  if (diffDays < 0) return { text: `באיחור של ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "יום" : "ימים"} (${dateStr})`, tone: "overdue" };
  if (diffDays === 0) return { text: `היום (${dateStr})`, tone: "today" };
  if (diffDays === 1) return { text: `מחר (${dateStr})`, tone: "soon" };
  return { text: dateStr, tone: "later" };
}

const dueDateToneClass: Record<string, string> = {
  overdue: "text-red-600 font-semibold",
  today: "text-orange-600 font-semibold",
  soon: "text-purple-600",
  later: "text-gray-400",
};

const dueDateToneIcon: Record<string, string> = {
  overdue: "⚠️",
  today: "🔥",
  soon: "📅",
  later: "📅",
};

function WhatsAppButton({ phone }: { phone?: string | null }) {
  if (!phone) return null;
  return (
    <a
      href={`https://wa.me/${toWhatsAppNumber(phone)}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
      title="פתח שיחת וואטסאפ"
    >
      💬 וואטסאפ
    </a>
  );
}

function ContactLink({ contactId, name }: { contactId: number; name: string }) {
  return (
    <a
      href={`/contacts/${contactId}`}
      className="text-xs px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 underline cursor-pointer transition-colors"
      title="מעבר לפרופיל הלקוח"
    >
      👤 {name}
    </a>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [t, c] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]);
    setTasks(t);
    setContacts(c);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      contactId: form.contactId ? Number(form.contactId) : null,
    };
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setOpen(false);
    setForm(empty);
    load();
  };

  const toggle = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const isOverdue = (t: Task) => !t.completed && !!t.dueDate && startOfDay(new Date(t.dueDate)) < startOfDay(new Date());

  // ממתינות: קודם באיחור, אחר כך לפי תאריך יעד קרוב, ובסוף בלי תאריך יעד בכלל
  const pending = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const done = tasks.filter((t) => t.completed);
  const overdueCount = pending.filter(isOverdue).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">משימות</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            + משימה חדשה
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>משימה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>משימה *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="תיאור המשימה" />
              </div>
              <div>
                <Label>תאריך יעד</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <Label>קשור ללקוח</Label>
                <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="בחר לקוח (אופציונלי)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={save} className="w-full">הוסף משימה</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pending.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {overdueCount > 0 ? (
            <span className="text-red-600 font-semibold">⚠️ {overdueCount} משימות באיחור</span>
          ) : (
            <span>אין משימות באיחור 🎉</span>
          )}
          {" · "}
          {pending.length} ממתינות בסך הכל
        </p>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>אין משימות עדיין. הוסף את הראשונה!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">ממתינות ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map((t) => {
                const due = t.dueDate ? dueDateLabel(t.dueDate) : null;
                return (
                  <div key={t.id} className={`bg-white border rounded-lg px-4 py-3 flex items-center gap-3 ${isOverdue(t) ? "border-red-300 bg-red-50" : ""}`}>
                    <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} className="w-4 h-4 accent-purple-600 cursor-pointer shrink-0" title="סמן כהושלם" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{t.title}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                        {t.contact && <ContactLink contactId={t.contact.id} name={t.contact.name} />}
                        {t.contact && <WhatsAppButton phone={t.contact.phone} />}
                        {due && (
                          <span className={`text-xs ${dueDateToneClass[due.tone]}`}>
                            {dueDateToneIcon[due.tone]} {due.text}
                          </span>
                        )}
                        {!t.dueDate && <span className="text-xs text-gray-300">ללא תאריך יעד</span>}
                      </div>
                    </div>
                    <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg shrink-0" title="מחק משימה">✕</button>
                  </div>
                );
              })}
              {pending.length === 0 && <p className="text-sm text-gray-400 py-2">כל המשימות הושלמו! 🎉</p>}
            </div>
          </div>

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">הושלמו ({done.length})</h2>
              <div className="space-y-1">
                {done.map((t) => (
                  <div key={t.id} className="bg-gray-50 border rounded-lg px-4 py-2 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} className="w-4 h-4 accent-purple-600 cursor-pointer shrink-0" title="סמן כלא הושלם" />
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <p className="text-sm line-through text-gray-400">{t.title}</p>
                      {t.contact && <ContactLink contactId={t.contact.id} name={t.contact.name} />}
                      {t.contact && <WhatsAppButton phone={t.contact.phone} />}
                    </div>
                    <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0" title="מחק משימה">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
