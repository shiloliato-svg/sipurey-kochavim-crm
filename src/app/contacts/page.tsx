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

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: string;
  createdAt: string;
  _count?: { deals: number; tasks: number };
  activities?: { note: string; createdAt: string; type: string }[];
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

const empty = { name: "", email: "", phone: "", company: "", notes: "", status: "חדש" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("הכל");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);

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
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", notes: c.notes ?? "", status: c.status ?? "חדש" });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אנשי קשר</h1>
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
                <TableHead className="text-right">הודעה אחרונה</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">עסקאות</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell className="max-w-xs">
                    {c.activities?.[0] ? (
                      <div>
                        <p className="text-sm truncate text-gray-700">{c.activities[0].note}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(c.activities[0].createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
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
                    {c._count?.deals ? (
                      <Badge variant="secondary">{c._count.deals}</Badge>
                    ) : "—"}
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
