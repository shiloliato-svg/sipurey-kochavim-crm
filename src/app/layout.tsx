import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "סיפורי כוכבים | CRM",
  description: "מערכת ניהול לקוחות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <span className="text-xl font-bold text-purple-700">✨ סיפורי כוכבים</span>
            <nav className="flex gap-4">
              <Link href="/" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                דשבורד
              </Link>
              <Link href="/contacts" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                אנשי קשר
              </Link>
              <Link href="/deals" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                עסקאות
              </Link>
              <Link href="/tasks" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                משימות
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
