import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CurrentUserDisplay from "@/components/CurrentUserDisplay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Bank",
  description: "時間銀行とプロジェクト管理のためのアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ヘッダー */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">Time Bank</h1>
              </div>
              <CurrentUserDisplay />
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
