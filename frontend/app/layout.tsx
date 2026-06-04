import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripPlan",
  description: "AI Travel Planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen flex">

        {/* Sidebar */}
        <aside className="w-72 bg-white border-r flex flex-col">

          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">
              TripPlan
            </h1>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4">

            <div className="space-y-2">

              <Link
                href="/"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          bg-blue-50
          text-blue-600
          font-medium
        "
              >
                🏠 홈
              </Link>

              <Link
                href="/trip/create"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          hover:bg-gray-100
        "
              >
                ✈️ 내 여행
              </Link>

              <Link
                href="/map-test"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          hover:bg-gray-100
        "
              >
                🗺️ 지도 검색
              </Link>

              <Link
                href="/trip/result"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          hover:bg-gray-100
        "
              >
                ⭐ 추천 장소
              </Link>

              <Link
                href="/favorites"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          hover:bg-gray-100
        "
              >
                ❤️ 찜 목록
              </Link>

              <Link
                href="/trip/manage"
                className="
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          hover:bg-gray-100
        "
              >
                📅 여행 관리
              </Link>

            </div>

          </nav>

          {/* Bottom */}
          <div className="border-t p-4">

            <button
              className="
        w-full
        flex items-center gap-3
        px-4 py-3
        rounded-xl
        hover:bg-gray-100
      "
            >
              ⚙️ 설정
            </button>

            <div
              className="
        mt-3
        flex items-center gap-3
        px-4 py-3
      "
            >
              <div className="w-10 h-10 rounded-full bg-gray-300" />

              <div>
                <p className="font-medium">
                  사용자
                </p>

                <p className="text-sm text-gray-500">
                  user@email.com
                </p>
              </div>

            </div>

          </div>

        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>

      </body>
    </html>
  );
}