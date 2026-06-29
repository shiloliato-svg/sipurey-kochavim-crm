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
import { Badge } from "@/components/ui/badge";

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
  contactId?: number;
  contact?: { name: string };
  dealId?: number;
  deal?: { title: string };
};

type Contact = { id: number; name: string };

const empty = { title: "", dueDate: "", contactId: "", dealId: "" };

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

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const isOverdue = (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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
              {pending.map((t) => (
                <div key={t.id} className={`bg-white border rounded-lg px-4 py-3 flex items-center gap-3 ${isOverdue(t) ? "border-red-300 bg-red-50" : ""}`}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} className="w-4 h-4 accent-purple-600 cursor-pointer" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.title}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {t.contact && <Badge variant="outline" className="text-xs">{t.contact.name}</Badge>}
                      {t.dueDate && (
                        <span className={`text-xs ${isOverdue(t) ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                          {isOverdue(t) ? "⚠️ " : "📅 "}
                          {new Date(t.dueDate).toLocaleDateString("he-IL")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg">✕</button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-sm text-gray-400 py-2">כל המשימות הושלמו! 🎉</p>}
            </div>
          </div>

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">הושלמו ({done.length})</h2>
              <div className="space-y-1">
                {done.map((t) => (
                  <div key={t.id} className="bg-gray-50 border rounded-lg px-4 py-2 flex items-center gap-3 opacity-60">
                    <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} className="w-4 h-4 accent-purple-600 cursor-pointer" />
                    <p className="text-sm line-through text-gray-400 flex-1">{t.title}</p>
                    <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400 transition-colors">✕</button>
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
