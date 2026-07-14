"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTrip } from "../context/TripContext"
import { Trip } from "../types"
import { useSearchPanel } from "../context/SearchPanelContext"

export default function HomePage() {
    const { user, currentTrip } = useTrip()
    const { isOpen, setIsOpen } = useSearchPanel()
    const router = useRouter()

    const calculateDday = () => {
        if (!currentTrip?.start_date) return null
        const today = new Date()
        const start = new Date(currentTrip.start_date)
        const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }

    const dday = calculateDday()

    const getDdayLabel = () => {
        if (dday === null) return "-"
        if (dday === 0) return "D-Day"
        if (dday > 0) return `D-${dday}`
        return `D+${Math.abs(dday)}`
    }

    const quickMenus = [
        {
            href: "/trip/create",
            icon: "✈️",
            label: "직접 계획하기",
            desc: "나만의 일정 만들기",
            gradient: "from-blue-500 to-blue-600",
        },
        {
            href: "/trip/ai-recommend",
            icon: "✨",
            label: "AI 추천 코스",
            desc: "AI가 일정을 짜줘요",
            gradient: "from-violet-500 to-purple-600",
        },
        {
            href: "/trip/result",
            icon: "📋",
            label: "내 여행 목록",
            desc: "전체 일정 보기",
            gradient: "from-emerald-500 to-teal-600",
        },
        {
            href: "#",
            icon: "🗺️",
            label: "지도 검색",
            desc: "주변 장소 찾기",
            gradient: "from-orange-400 to-rose-500",
        },
    ]

    return (
        <main className="p-8 max-w-5xl mx-auto">

            {/* 헤더 */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-sm text-gray-400 mb-1">
                        {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                        안녕하세요, <span className="text-blue-600">{user?.nickname || "여행자"}</span>님 👋
                    </h1>
                </div>
                <button
                    onClick={() => router.push("/settings")}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm hover:shadow-md transition"
                >
                    {user?.nickname?.[0]?.toUpperCase() ?? "?"}
                </button>
            </div>

            {/* 다가오는 여행 카드 */}
            <div className={`rounded-2xl mb-6 overflow-hidden ${currentTrip?.id ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200" : "bg-white border border-gray-100 shadow-sm"}`}>
                {currentTrip?.id ? (
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">다가오는 여행</span>
                                <h2 className="font-bold text-xl mt-1">{currentTrip.title}</h2>
                                <p className="text-blue-200 text-sm mt-0.5">
                                    {currentTrip.start_date} ~ {currentTrip.end_date}
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm text-white font-bold px-4 py-2 rounded-xl text-lg border border-white/30">
                                {getDdayLabel()}
                            </div>
                        </div>

                        <div className="mb-5">
                            <div className="flex justify-between text-xs text-blue-200 mb-2">
                                <span>일정 준비도</span>
                                <span className="font-semibold">{currentTrip.progress ?? 0}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full">
                                <div
                                    className="h-1.5 bg-white rounded-full transition-all duration-700"
                                    style={{ width: `${currentTrip.progress ?? 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push(`/trip/${currentTrip.id}`)}
                                className="bg-white text-blue-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
                            >
                                일정 보기
                            </button>
                            <button
                                onClick={() => router.push(`/trip/${currentTrip.id}`)}
                                className="bg-white/15 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-white/25 transition border border-white/20"
                            >
                                일정 수정
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">✈️</span>
                        </div>
                        <p className="text-gray-600 font-medium mb-1">등록된 여행이 없어요</p>
                        <p className="text-gray-400 text-sm mb-5">새로운 여행을 계획해보세요!</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => router.push("/trip/create")}
                                className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 text-sm transition"
                            >
                                직접 계획하기
                            </button>
                            <button
                                onClick={() => router.push("/trip/ai-recommend")}
                                className="bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-600 text-sm transition"
                            >
                                ✨ AI 추천받기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 퀵 메뉴 */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                {quickMenus.map((menu) => (
                    <button
                        key={menu.label}
                        onClick={() => {
                            if (menu.href === "#") {
                                setIsOpen(!isOpen)  // ← 현재 값 반전
                            } else {
                                router.push(menu.href)
                            }
                        }}
                        className="group bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <div className={`w-10 h-10 bg-gradient-to-br ${menu.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                            <span className="text-lg">{menu.icon}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-800">{menu.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{menu.desc}</p>
                    </button>
                ))}
            </div>

            {/* 최근 여행 */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">최근 여행</h2>
                    <button
                        onClick={() => router.push("/trip/result")}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                    >
                        전체보기 →
                    </button>
                </div>
                <RecentTrips />
            </section>
        </main>
    )
}

function RecentTrips() {
    const router = useRouter()
    const [trips, setTrips] = useState<Trip[]>([])

    useEffect(() => {
        import("../lib/api").then(({ default: api }) => {
            api.get("/trip").then((res) => {
                setTrips(res.data.slice(0, 3))
            }).catch(() => { })
        })
    }, [])

    if (trips.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">여행 기록이 없어요. 첫 여행을 계획해보세요!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            {trips.map((trip) => {
                const today = new Date()
                const start = new Date(trip.start_date)
                const end = new Date(trip.end_date)
                const dday = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                let status = `D-${dday}`
                let statusClass = "bg-blue-50 text-blue-600"
                if (today >= start && today <= end) {
                    status = "여행 중"
                    statusClass = "bg-green-50 text-green-600"
                } else if (dday <= 0) {
                    status = "완료"
                    statusClass = "bg-gray-100 text-gray-400"
                }

                const tripDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

                return (
                    <div
                        key={trip.id}
                        onClick={() => router.push(`/trip/${trip.id}`)}
                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p className="font-bold text-gray-900 truncate flex-1 text-sm">{trip.title}</p>
                            <span className={`text-xs font-semibold flex-shrink-0 ml-2 px-2 py-0.5 rounded-lg ${statusClass}`}>
                                {status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-gray-400">{trip.start_date} ~ {trip.end_date}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>📍 {trip.city}</span>
                                <span>·</span>
                                <span>{tripDays}일</span>
                                <span>·</span>
                                <span>{trip.people}명</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}