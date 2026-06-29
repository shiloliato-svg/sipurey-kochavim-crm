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
import { Badge } from "@/components/ui/badge";

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  _count?: { deals: number; tasks: number };
};

const empty = { name: "", email: "", phone: "", company: "", notes: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const res = await fetch("/api/contacts");
    setContacts(await res.json());
  };

  useEffect(() => { load(); }, []);

  const filtered = contacts.filter((c) =>
    [c.name, c.email, c.phone, c.company].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", notes: c.notes ?? "" });
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
                <Label>הערות</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="הערות נוספות..." rows={3} />
              </div>
              <Button onClick={save} className="w-full">{editing ? "שמור שינויים" : "הוסף"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון, אימייל או חברה..."
          className="max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p>אין אנשי קשר עדיין. הוסף את הראשון!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">חברה</TableHead>
                <TableHead className="text-right">עסקאות</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.company || "—"}</TableCell>
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
