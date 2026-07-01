"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: string;
  whatsappSummary?: string;
  bookCount?: string;
  leadState?: string;
  processStatus?: string;
  createdAt: string;
  _count?: { deals: number; tasks: number; activities: number };
  activities?: { note: string; createdAt: string; type: string }[];
  tasks?: { id: number; title: string; dueDate?: string }[];
};

const STATUSES = [
  { value: "חדש", label: "חדש", color: "bg-gray-100 text-gray-700" },
  { value: "חם", label: "🔥 חם", color: "bg-red-100 text-red-700" },
  { value: "פושר", label: "🌡️ פושר", color: "bg-yellow-100 text-yellow-700" },
  { value: "קר", label: "❄️ קר", color: "bg-blue-100 text-blue-700" },
  { value: "בטיפול", label: "⚙️ בטיפול", color: "bg-purple-100 text-purple-700" },
  { value: "סגור", label: "✅ סגור", color: "bg-green-100 text-green-700" },
];

const statusStyle = (s: string) =>
  STATUSES.find((x) => x.value === s)?.color ?? "bg-gray-100 text-gray-700";

const statusLabel = (s: string) =>
  STATUSES.find((x) => x.value === s)?.label ?? s;

const empty = { name: "", email: "", phone: "", company: "", notes: "", status: "חדש", whatsappSummary: "" };
const emptyTask = { title: "", dueDate: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("הכל");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);
  const [summarizing, setSummarizing] = useState<number | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [taskDialogContact, setTaskDialogContact] = useState<Contact | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [savingTask, setSavingTask] = useState(false);

  const load = async () => {
    const res = await fetch("/api/contacts");
    setContacts(await res.json());
  };

  useEffect(() => { load(); }, []);

  const filtered = contacts
    .filter((c) => filterStatus === "הכל" || c.status === filterStatus)
    .filter((c) =>
      [c.name, c.email, c.phone, c.company].some((v) =>
        v?.toLowerCase().includes(search.toLowerCase())
      )
    );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", notes: c.notes ?? "", status: c.status ?? "חדש", whatsappSummary: c.whatsappSummary ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await fetch(`/api/contacts/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setOpen(false);
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/contacts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("למחוק איש קשר זה?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    await fetch("/api/contacts/analyze-all", { method: "POST" });
    await load();
    setAnalyzingAll(false);
  };

  const summarize = async (id: number) => {
    setSummarizing(id);
    const res = await fetch(`/api/contacts/${id}/summarize`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "שגיאה בסיכום");
    }
    setSummarizing(null);
    load();
  };

  const openTaskDialog = (c: Contact) => {
    setTaskDialogContact(c);
    setTaskForm(emptyTask);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim() || !taskDialogContact) return;
    setSavingTask(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskForm.title,
        contactId: taskDialogContact.id,
        ...(taskForm.dueDate ? { dueDate: new Date(taskForm.dueDate).toISOString() } : {}),
      }),
    });
    setSavingTask(false);
    setTaskDialogContact(null);
    load();
  };

  return (
    <div>
      {/* Quick task dialog */}
      <Dialog open={!!taskDialogContact} onOpenChange={(o) => { if (!o) setTaskDialogContact(null); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>משימה חדשה — {taskDialogContact?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>כותרת המשימה *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="למשל: להתקשר מחר בבוקר"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveTask(); }}
              />
            </div>
            <div>
              <Label>תאריך יעד (אופציונלי)</Label>
              <Input
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <Button onClick={saveTask} disabled={savingTask || !taskForm.title.trim()} className="w-full">
              {savingTask ? "שומר..." : "הוסף משימה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = contacts.filter((c) => {
          const created = new Date(c.createdAt);
          return created >= today && (c._count?.activities ?? 0) === 0;
        });
        if (newToday.length === 0) return null;
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-green-700">{newToday.length}</span>
            <div>
              <p className="font-semibold text-green-800">לידים חדשים היום 🎉</p>
              <p className="text-xs text-green-600">פנו אליך היום ועדיין לא דיברת איתם בוואטספ</p>
            </div>
            <div className="mr-auto flex flex-wrap gap-1">
              {newToday.slice(0, 5).map((c) => (
                <span key={c.id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{c.name}</span>
              ))}
              {newToday.length > 5 && <span className="text-xs text-green-500">+{newToday.length - 5}</span>}
            </div>
          </div>
        );
      })()}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">אנשי קשר</h1>
          <button
            onClick={analyzeAll}
            disabled={analyzingAll}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black transition-all disabled:opacity-50"
          >
            {analyzingAll ? "מנתח..." : "🔍 נתח מצב כל הלידים"}
          </button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} />}>
            + הוסף איש קשר
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>שם *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="שם מלא" />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
              </div>
              <div>
                <Label>חברה</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="שם החברה" />
              </div>
              <div>
                <Label>סטטוס</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? "חדש" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>סיכום שיחה</Label>
                <Textarea value={form.whatsappSummary} onChange={(e) => setForm({ ...form, whatsappSummary: e.target.value })} placeholder="סכם כאן את השיחה עם הליד..." rows={3} />
              </div>
              <div>
                <Label>הערות</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="הערות נוספות..." rows={3} />
              </div>
              <Button onClick={save} className="w-full">{editing ? "שמור שינויים" : "הוסף"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש..."
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {["הכל", ...STATUSES.map((s) => s.value)].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterStatus === s ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}
            >
              {s === "הכל" ? "הכל" : statusLabel(s)}
              <span className="mr-1 text-xs opacity-70">
                ({s === "הכל" ? contacts.length : contacts.filter((c) => c.status === s).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p>אין אנשי קשר. הוסף את הראשון!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">משימה פתוחה</TableHead>
                <TableHead className="text-right">שלב תהליך</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">כמה ספרים?</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:text-purple-700 hover:underline block">
                      {c.name}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {c.tasks?.[0] ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 inline-block">
                            ⏰ {c.tasks[0].title}
                          </span>
                          {c.tasks[0].dueDate && (
                            <span className={`text-xs ${new Date(c.tasks[0].dueDate) < new Date() ? "text-red-500" : "text-gray-400"}`}>
                              {new Date(c.tasks[0].dueDate).toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                      <button
                        onClick={() => openTaskDialog(c)}
                        className="text-xs text-gray-400 hover:text-black border border-dashed border-gray-200 hover:border-black rounded px-2 py-0.5 w-fit transition-colors"
                      >
                        + משימה
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.processStatus ?? "חדש"}
                      onValueChange={async (v) => {
                        if (!v) return;
                        await fetch(`/api/contacts/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ processStatus: v }) });
                        load();
                      }}
                    >
                      <SelectTrigger className={`text-xs h-7 font-semibold rounded-full border px-2 ${
                        c.processStatus === "שולם" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        c.processStatus === "נשלח" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        c.processStatus === "מחכה לתשלום" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        c.processStatus === "בהכנה" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        c.processStatus === "לא רלוונטי" ? "bg-gray-100 text-gray-500 border-gray-200" :
                        c.processStatus === "ללא מענה" ? "bg-red-50 text-red-400 border-red-200" :
                        c.processStatus === "מחכה לפרטים" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                        c.processStatus === "יצרנו קשר" ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["חדש","יצרנו קשר","מחכה לפרטים","מחכה לתשלום","ללא מענה","בהכנה","נשלח","לא רלוונטי","שולם"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={c.status ?? "חדש"} onValueChange={(v) => v && updateStatus(c.id, v)}>
                      <SelectTrigger className={`w-32 text-xs h-7 ${statusStyle(c.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {["1","2","3","4","5+"].map((n) => (
                        <button
                          key={n}
                          onClick={async () => {
                            await fetch(`/api/contacts/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookCount: n }) });
                            load();
                          }}
                          className={`w-7 h-7 rounded-full text-xs font-semibold border-2 transition-all ${
                            c.bookCount === n
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-400 hover:border-gray-500"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>עריכה</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>מחיקה</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
