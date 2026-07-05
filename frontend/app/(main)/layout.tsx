"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import SearchPanel from "../components/SearchPanel"
import api from "../lib/api"
import { useRouter } from "next/navigation"
import { useTrip } from "../context/TripContext"
import { useSearchPanel } from "../context/SearchPanelContext"
import { useEffect } from "react"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isOpen, setIsOpen } = useSearchPanel()
    const router = useRouter()
    const pathname = usePathname()
    const { user, setUser, setCurrentTrip } = useTrip()

    useEffect(() => {
        const loadData = async () => {
            try {
                const me = await api.get("/me")
                setUser(me.data)
            } catch {
                router.push("/login")
                return
            }
            try {
                const upcoming = await api.get("/trip/upcoming")
                setCurrentTrip(upcoming.data)
            } catch {
                setCurrentTrip(null)
            }
        }
        loadData()
    }, [])

    const menus = [
        { href: "/", icon: "🏠", label: "홈" },
        { href: "/trip/result", icon: "✈️", label: "내 여행" },
        { href: "/trip/ai-recommend", icon: "✨", label: "AI 추천 코스" },
        { href: "/trip/create", icon: "➕", label: "새 여행 계획" },
        { href: "/settings", icon: "⚙️", label: "설정" },
    ]

    return (
        <div className="h-screen flex bg-[#f8fafc]">

            {/* Sidebar */}
            <aside className="w-56 bg-white border-r flex flex-col">

                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b">
                    <h1 className="text-3xl font-bold text-blue-600">TripPlan</h1>
                </div>

                {/* Menu */}
                <nav className="flex-1 p-3">
                    <div className="space-y-1">

                        {menus.map((menu) => {
                            const isActive = pathname === menu.href
                            return (
                                <Link
                                    key={menu.href}
                                    href={menu.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
                                        isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    <span className="text-lg">{menu.icon}</span>
                                    {menu.label}
                                </Link>
                            )
                        })}

                        {/* 지도 검색 토글 */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
                                isOpen
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <span className="text-lg">🗺️</span>
                            지도 검색
                        </button>

                    </div>
                </nav>

                {/* Profile */}
                <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                            {user?.nickname?.[0] ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user?.nickname || "로딩중..."}</p>
                            <button
                                onClick={async () => {
                                    await api.post("/logout")
                                    router.push("/login")
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 transition"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>

            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto transition-all duration-300">
                {children}
            </main>

            {/* 전역 지도 패널 */}
            <SearchPanel />

        </div>
    )
}