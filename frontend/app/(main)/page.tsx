"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTrip } from "../context/TripContext"

export default function HomePage() {
    const { user, currentTrip } = useTrip()
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
            label: "새 여행 계획",
            desc: "직접 일정 짜기",
            color: "bg-blue-50 hover:bg-blue-100",
        },
        {
            href: "/trip/ai-recommend",
            icon: "✨",
            label: "AI 추천 코스",
            desc: "AI가 일정 생성",
            color: "bg-purple-50 hover:bg-purple-100",
        },
        {
            href: "/trip/result",
            icon: "📋",
            label: "내 여행 목록",
            desc: "전체 일정 보기",
            color: "bg-green-50 hover:bg-green-100",
        },
        {
            href: "#",
            icon: "🗺️",
            label: "지도 검색",
            desc: "장소 찾기",
            color: "bg-orange-50 hover:bg-orange-100",
        },
    ]

    return (
        <main className="p-8">
            <div className="max-w-6xl mx-auto">

                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            안녕하세요, {user?.nickname || "여행자"}님 👋
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            오늘도 즐거운 여행을 계획해보세요
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push("/trip/result")}
                            className="px-4 py-2 rounded-xl border border-[#ECEEF2] bg-white text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            내 여행 전체보기
                        </button>
                        <button
                            onClick={() => router.push("/settings")}
                            className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-200 transition"
                            title="설정"
                        >
                            {user?.nickname?.[0] ?? "?"}
                        </button>
                    </div>
                </div>

                {/* 다가오는 여행 카드 */}
                <div className={`rounded-3xl p-6 mb-8 ${currentTrip?.id ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-white border border-[#ECEEF2]"}`}>
                    {currentTrip?.id ? (
                        <>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 text-sm mb-1">다가오는 여행</p>
                                    <h2 className="font-bold text-2xl">{currentTrip.title}</h2>
                                    <p className="text-blue-100 mt-1 text-sm">
                                        {currentTrip.start_date} ~ {currentTrip.end_date}
                                    </p>
                                </div>
                                <div className="bg-white text-blue-600 font-bold px-4 py-2 rounded-2xl text-lg flex-shrink-0">
                                    {getDdayLabel()}
                                </div>
                            </div>

                            {/* 진행도 */}
                            <div className="mt-6">
                                <div className="flex justify-between text-sm text-blue-100 mb-2">
                                    <span>일정 준비도</span>
                                    <span>{currentTrip.progress ?? 0}%</span>
                                </div>
                                <div className="h-2 bg-blue-400 rounded-full">
                                    <div
                                        className="h-2 bg-white rounded-full transition-all duration-500"
                                        style={{ width: `${currentTrip.progress ?? 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* 버튼 */}
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button
                                    onClick={() => router.push(`/trip/${currentTrip.id}`)}
                                    className="bg-white text-blue-600 text-center py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                                >
                                    일정 보기
                                </button>
                                <button
                                    onClick={() => router.push(`/trip/${currentTrip.id}`)}
                                    className="bg-blue-400 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-300 transition"
                                >
                                    일정 수정
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="text-4xl mb-3">✈️</div>
                            <p className="text-gray-500 mb-4">아직 등록된 여행이 없어요</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => router.push("/trip/create")}
                                    className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 text-sm"
                                >
                                    직접 계획하기
                                </button>
                                <button
                                    onClick={() => router.push("/trip/ai-recommend")}
                                    className="bg-white border border-blue-500 text-blue-500 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 text-sm"
                                >
                                    ✨ AI 추천받기
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 퀵 메뉴 */}
                <div className="grid grid-cols-4 gap-4 mb-10">
                    {quickMenus.map((menu) => (
                        <Link
                            key={menu.label}
                            href={menu.href}
                            className={`${menu.color} rounded-2xl p-5 text-center transition`}
                        >
                            <div className="text-3xl mb-2">{menu.icon}</div>
                            <p className="font-semibold text-sm text-gray-800">{menu.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{menu.desc}</p>
                        </Link>
                    ))}
                </div>

                {/* 최근 여행 목록 */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">최근 여행</h2>
                        <button
                            onClick={() => router.push("/trip/result")}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            전체보기 →
                        </button>
                    </div>

                    <RecentTrips />
                </section>

            </div>
        </main>
    )
}

// 최근 여행 목록 컴포넌트
function RecentTrips() {
    const router = useRouter()
    const [trips, setTrips] = useState<any[]>([])

    useEffect(() => {
        import("../lib/api").then(({ default: api }) => {
            api.get("/trip").then((res) => {
                setTrips(res.data.slice(0, 3)) // 최근 3개만
            }).catch(() => { })
        })
    }, [])

    if (trips.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#ECEEF2]">
                <p className="text-gray-400 text-sm">여행 기록이 없어요. 첫 여행을 계획해보세요!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-4">
            {trips.map((trip) => {
                const today = new Date()
                const start = new Date(trip.start_date)
                const end = new Date(trip.end_date)
                const dday = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                let status = `D-${dday}`
                let statusColor = "text-blue-500"
                if (today >= start && today <= end) {
                    status = "여행 중"
                    statusColor = "text-green-500"
                } else if (dday <= 0) {
                    status = "완료"
                    statusColor = "text-gray-400"
                }

                return (
                    <div
                        key={trip.id}
                        onClick={() => router.push(`/trip/${trip.id}`)}
                        className="bg-white rounded-2xl p-5 border border-[#ECEEF2] hover:shadow-md cursor-pointer transition"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="font-bold truncate flex-1">{trip.title}</p>
                            <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${statusColor}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">{trip.start_date} ~ {trip.end_date}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {trip.city} · {trip.people}명
                        </p>
                    </div>
                )
            })}
        </div>
    )
}