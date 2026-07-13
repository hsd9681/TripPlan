"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import SearchPanel from "../components/SearchPanel"
import api from "../lib/api"
import { useTrip } from "../context/TripContext"
import { useSearchPanel } from "../context/SearchPanelContext"
import { useEffect, useState } from "react"

const HomeIcon = ({ active }: { active: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)

const PlaneIcon = ({ active }: { active: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
)

const SparkleIcon = ({ active }: { active: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
)

const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
)

const MapIcon = ({ active }: { active: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
)

const SettingsIcon = ({ active }: { active: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
)

const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
)

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { isOpen, setIsOpen } = useSearchPanel()
    const router = useRouter()
    const pathname = usePathname()
    const { user, setUser, setCurrentTrip } = useTrip()
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const me = await api.get("/me")
                if (!me.data || me.data.message === "unauthorized") {
                    router.push("/login")
                    return
                }
                setUser(me.data)
                setAuthChecked(true)
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

    if (!authChecked) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">로딩 중...</p>
                </div>
            </div>
        )
    }

    const menus = [
        { href: "/", label: "홈", Icon: HomeIcon },
        { href: "/trip/result", label: "내 여행", Icon: PlaneIcon },
        { href: "/trip/ai-recommend", label: "AI 추천 코스", Icon: SparkleIcon },
        { href: "/trip/create", label: "새 여행 계획", Icon: PlusIcon },
        { href: "/settings", label: "설정", Icon: SettingsIcon },
    ]

    return (
        <div className="h-screen flex bg-[#f5f6fa]">

            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm">

                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" fill="white" stroke="#3b82f6" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">TripPlan</span>
                        <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">AI</span>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {menus.map((menu) => {
                        const isActive = pathname === menu.href
                        return (
                            <Link
                                key={menu.href}
                                href={menu.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                                    isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                            >
                                <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                                    <menu.Icon active={isActive} />
                                </span>
                                {menu.label}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                            </Link>
                        )
                    })}

                    {/* 지도 검색 */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                            isOpen
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                    >
                        <span className={isOpen ? "text-blue-600" : "text-gray-400"}>
                            <MapIcon active={isOpen} />
                        </span>
                        지도 검색
                        {isOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                </nav>

                {/* Profile */}
                <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                            {user?.nickname?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">{user?.nickname || "로딩중..."}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={async () => { await api.post("/logout"); router.push("/login") }}
                            className="text-gray-400 hover:text-red-400 transition flex-shrink-0"
                            title="로그아웃"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>

            <SearchPanel />
        </div>
    )
}