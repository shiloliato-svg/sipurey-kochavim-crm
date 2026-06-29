import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [contactCount, dealCount, taskCount, recentContacts, activeTasks] = await Promise.all([
    prisma.contact.count(),
    prisma.deal.count({ where: { stage: { not: "בוטל" } } }),
    prisma.task.count({ where: { completed: false } }),
    prisma.contact.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.task.findMany({
      where: { completed: false },
      orderBy: [{ dueDate: "asc" }],
      take: 5,
      include: { contact: { select: { name: true } } },
    }),
  ]);

  const dealsByStage = await prisma.deal.groupBy({
    by: ["stage"],
    _count: { id: true },
    where: { stage: { not: "בוטל" } },
  });

  const totalValue = await prisma.deal.aggregate({
    _sum: { value: true },
    where: { stage: { not: "בוטל" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">דשבורד</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="אנשי קשר" value={contactCount} icon="👥" href="/contacts" color="blue" />
        <StatCard title="עסקאות פעילות" value={dealCount} icon="💼" href="/deals" color="purple" />
        <StatCard title="משימות פתוחות" value={taskCount} icon="✅" href="/tasks" color="orange" />
        <StatCard
          title="שווי צינור"
          value={`₪${(totalValue._sum.value ?? 0).toLocaleString()}`}
          icon="💰"
          href="/deals"
          color="green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">לקוחות אחרונים</h2>
            <Link href="/contacts" className="text-sm text-purple-600 hover:underline">הכל →</Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-sm text-gray-400">אין לקוחות עדיין</p>
          ) : (
            <ul className="space-y-2">
              {recentContacts.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">משימות קרובות</h2>
            <Link href="/tasks" className="text-sm text-purple-600 hover:underline">הכל →</Link>
          </div>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-gray-400">אין משימות פתוחות 🎉</p>
          ) : (
            <ul className="space-y-2">
              {activeTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="text-lg">
                    {t.dueDate && new Date(t.dueDate) < new Date() ? "⚠️" : "📋"}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.contact && <p className="text-xs text-gray-400">{t.contact.name}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {dealsByStage.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">עסקאות לפי שלב</h2>
              <Link href="/deals" className="text-sm text-purple-600 hover:underline">לצינור →</Link>
            </div>
            <div className="flex gap-3 flex-wrap">
              {dealsByStage.map((d) => (
                <div key={d.stage} className="bg-gray-50 border rounded-lg px-4 py-3 text-center min-w-24">
                  <p className="text-2xl font-bold text-purple-700">{d._count.id}</p>
                  <p className="text-xs text-gray-500 mt-1">{d.stage}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, href, color,
}: {
  title: string;
  value: number | string;
  icon: string;
  href: string;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <Link href={href}>
      <div className={`rounded-lg border p-4 hover:shadow-md transition-shadow ${colors[color]}`}>
        <p className="text-2xl mb-1">{icon}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-70 mt-1">{title}</p>
      </div>
    </Link>
  );
}
