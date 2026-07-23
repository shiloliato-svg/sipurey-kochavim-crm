"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
  lastFollowUpAt?: string;
  lastFollowUpMessage?: string;
};

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: string;
  whatsappSummary?: string;
  leadSource?: string;
  processStatus: string;
  productInterest?: string;
  createdAt: string;
  tasks: Task[];
  activities: { id: number; note: string; createdAt: string; type: string }[];
};

const LEAD_STATUSES = [
  { value: "חדש", color: "bg-gray-100 text-gray-700" },
  { value: "חם", color: "bg-red-100 text-red-700" },
  { value: "פושר", color: "bg-yellow-100 text-yellow-700" },
  { value: "קר", color: "bg-blue-100 text-blue-700" },
  { value: "בטיפול", color: "bg-purple-100 text-purple-700" },
  { value: "סגור", color: "bg-green-100 text-green-700" },
];

const PROCESS_STEPS = [
  "חדש",
  "יצרנו קשר",
  "מחכה לפרטים",
  "מחכה לתשלום",
  "ללא מענה",
  "בהכנה",
  "נשלח",
  "לא רלוונטי",
  "שולם",
];

const PROCESS_COLORS: Record<string, string> = {
  "חדש": "bg-gray-400",
  "יצרנו קשר": "bg-blue-400",
  "מחכה לפרטים": "bg-yellow-400",
  "מחכה לתשלום": "bg-orange-400",
  "ללא מענה": "bg-red-300",
  "בהכנה": "bg-purple-400",
  "נשלח": "bg-teal-400",
  "לא רלוונטי": "bg-gray-300",
  "שולם": "bg-green-500",
};

const LEAD_SOURCES = ["אינסטגרם", "פייסבוק", "המלצה", "גוגל", "טיקטוק", "ישיר", "אחר"];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", dueDate: "" });
  const [addingTask, setAddingTask] = useState(false);

  const toWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("972")) return digits;
    if (digits.startsWith("0")) return "972" + digits.slice(1);
    return "972" + digits;
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (res.ok) setContact(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!contact) return;
    const upcoming = contact.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) > new Date()
    );
    if (upcoming.length === 0) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();

    const timers = upcoming.map((t) => {
      const ms = new Date(t.dueDate!).getTime() - Date.now();
      if (ms <= 0 || ms > 86400000) return null;
      return setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(`תזכורת: ${contact.name}`, { body: t.title });
        }
      }, ms);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [contact]);

  const patch = async (data: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
    setSaving(false);
  };

  const summarize = async () => {
    setSummarizing(true);
    const res = await fetch(`/api/contacts/${id}/summarize`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "שגיאה בסיכום");
    }
    await load();
    setSummarizing(false);
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        ...(newTask.dueDate ? { dueDate: new Date(newTask.dueDate).toISOString() } : {}),
        contactId: Number(id),
      }),
    });
    setNewTask({ title: "", dueDate: "" });
    setAddingTask(false);
    load();
  };

  const toggleTask = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    load();
  };

  const deleteTask = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    load();
  };

  if (!contact) return <div className="py-20 text-center text-gray-400">טוען...</div>;

  const statusColor = LEAD_STATUSES.find((s) => s.value === contact.status)?.color ?? "bg-gray-100 text-gray-700";
  const pendingTasks = contact.tasks.filter((t) => !t.completed);
  const doneTasks = contact.tasks.filter((t) => t.completed);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16" dir="rtl">

      {/* ← חזרה */}
      <button onClick={() => router.push("/contacts")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 pt-1">
        ← חזרה לרשימה
      </button>

      {/* כרטיס ראשי */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
              {contact.phone && <span>📞 {contact.phone}</span>}
              {contact.email && <span>✉️ {contact.email}</span>}
              {contact.company && <span>🏢 {contact.company}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 items-center text-xs text-gray-400">
              <span>נוצר: {new Date(contact.createdAt).toLocaleDateString("he-IL")}</span>
              {contact.leadSource && <span>| מקור: {contact.leadSource}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${statusColor} border-0 text-sm px-3 py-1`}>{contact.status}</Badge>
          </div>
        </div>

        {/* כפתורי פעולה מהירה */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {contact.phone && (
            <a href={`https://wa.me/${toWhatsAppNumber(contact.phone)}`} target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-1">
                💬 וואטספ
              </Button>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`}>
              <Button size="sm" variant="outline" className="gap-1">✉️ מייל</Button>
            </a>
          )}
        </div>

        {/* שדות עריכה מהירה */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">סטטוס ליד</label>
            <Select value={contact.status} onValueChange={(v) => v && patch({ status: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">מקור הגעה</label>
            <Select value={contact.leadSource ?? ""} onValueChange={(v) => v && patch({ leadSource: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="בחר מקור" /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* שלב תהליך */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">שלב תהליך</h2>
        <div className="flex flex-wrap gap-2">
          {PROCESS_STEPS.map((step) => {
            const active = contact.processStatus === step;
            return (
              <button
                key={step}
                onClick={() => patch({ processStatus: step })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                  active
                    ? "bg-white text-black border-black shadow-md"
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-500 hover:text-gray-700"
                }`}
              >
                {step}
              </button>
            );
          })}
        </div>
      </div>

      {/* פרטי הזמנה */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">פרטי הזמנה</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">מוצר / שירות שמעניין את הלקוח</label>
          <Input
            defaultValue={contact.productInterest ?? ""}
            placeholder="לדוגמה: חבילת זוגות, מנוי שנתי..."
            className="text-sm"
            onBlur={(e) => {
              if (e.target.value !== (contact.productInterest ?? ""))
                patch({ productInterest: e.target.value });
            }}
          />
        </div>
      </div>

      {/* תיעוד שיחה */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">תיעוד שיחה</h2>
        <Textarea
          key={contact.notes}
          defaultValue={contact.notes ?? ""}
          placeholder="כתוב כאן כל מה שחשוב לזכור על הלקוח..."
          rows={5}
          className="text-sm resize-none"
          onBlur={(e) => {
            if (e.target.value !== (contact.notes ?? ""))
              patch({ notes: e.target.value });
          }}
        />
        {saving && <p className="text-xs text-gray-400 mt-1">שומר...</p>}
      </div>

      {/* סיכום שיחת וואטספ */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">סיכום שיחת וואטספ (AI)</h2>
          <button
            onClick={summarize}
            disabled={summarizing}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black transition-all disabled:opacity-50"
          >
            {summarizing ? "מסכם..." : contact.whatsappSummary ? "עדכן סיכום" : "סכם שיחה"}
          </button>
        </div>
        {contact.whatsappSummary ? (
          <p className="text-sm text-gray-700 leading-relaxed bg-purple-50 rounded-lg p-3">
            {contact.whatsappSummary}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">אין סיכום עדיין. לחץ "סכם שיחה" לסיכום אוטומטי.</p>
        )}
      </div>

      {/* משימות ותזכורות */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">משימות ותזכורות</h2>
          <button
            onClick={() => setAddingTask(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black transition-all"
          >
            + הוסף משימה
          </button>
        </div>

        {addingTask && (
          <div className="flex gap-2 mb-3 flex-wrap">
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="כותרת המשימה"
              className="text-sm flex-1 min-w-0"
            />
            <Input
              type="datetime-local"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="text-sm w-48"
            />
            <button onClick={addTask} className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-black bg-white text-black hover:bg-gray-50 transition-all">הוסף</button>
            <button onClick={() => setAddingTask(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-gray-200 bg-white text-gray-400 hover:border-gray-500 hover:text-gray-700 transition-all">ביטול</button>
          </div>
        )}

        {pendingTasks.length === 0 && doneTasks.length === 0 && (
          <p className="text-sm text-gray-400 italic">אין משימות עדיין.</p>
        )}

        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div key={task.id} className="p-2 rounded-lg hover:bg-gray-50 group">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <span className="text-sm flex-1">{task.title}</span>
                {task.dueDate && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    new Date(task.dueDate) < new Date()
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    🕐 {new Date(task.dueDate).toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs"
                >
                  ✕
                </button>
              </div>
              {task.lastFollowUpAt && (
                <p className="text-xs text-emerald-600 mt-1 mr-6">
                  פולו אפ נשלח {new Date(task.lastFollowUpAt).toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {task.lastFollowUpMessage && ` - "${task.lastFollowUpMessage}"`}
                </p>
              )}
            </div>
          ))}
          {doneTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg opacity-50 group">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm flex-1 line-through text-gray-400">{task.title}</span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
