"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"
import { toast } from "react-hot-toast"

// 도시별 이미지 매핑
const CITY_IMAGES: { [key: string]: string } = {
    "도쿄": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200",
    "오사카": "https://images.unsplash.com/photo-1590559899731-a382839e5549?q=80&w=1200",
    "교토": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200",
    "서울": "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?q=80&w=1200",
    "부산": "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200",
    "파리": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1200",
    "뉴욕": "https://images.unsplash.com/photo-1499092346302-b8d7a3b4d2e7?q=80&w=1200",
    "런던": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200",
    "방콕": "https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?q=80&w=1200",
    "싱가포르": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200",
    "홍콩": "https://images.unsplash.com/photo-1506970845246-18f21d533b20?q=80&w=1200",
    "바르셀로나": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1200",
    "로마": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200",
    "베이징": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1200",
    "상하이": "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?q=80&w=1200",
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1200"

function getCityImage(city: string, country: string): string {
    // 도시명으로 먼저 찾고, 없으면 국가명으로 찾고, 없으면 기본 이미지
    return CITY_IMAGES[city] || CITY_IMAGES[country] || DEFAULT_IMAGE
}

export default function TripResultPage() {
    const router = useRouter()
    const [trips, setTrips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    useEffect(() => {
        api.get("/me")
            .then(() => api.get("/trip"))
            .then((res) => {
                setTrips(res.data)
                setLoading(false)
            })
            .catch(() => {
                router.push("/login")
            })
    }, [])

    // 변경 후 — confirm 제거하고 삭제 확인 state로 처리
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const deleteTrip = async (tripId: number) => {
        try {
            await api.delete(`/trip/${tripId}`)
            setTrips(trips.filter((t: any) => t.id !== tripId))
            setDeletingId(null)
            toast.success("여행이 삭제되었습니다.")
        } catch {
            toast.error("삭제에 실패했습니다.")
        }
    }

    return (
        <main className="max-w-6xl mx-auto px-8 py-10">

            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold">내 여행 일정</h1>
                <button
                    onClick={() => router.push("/trip/create")}
                    className="bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition font-semibold"
                >
                    + 여행 만들기
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    불러오는 중...
                </div>
            ) : trips.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">✈️</div>
                    <p className="text-gray-500 text-lg mb-6">아직 여행 일정이 없어요</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push("/trip/create")}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600"
                        >
                            직접 계획하기
                        </button>
                        <button
                            onClick={() => router.push("/trip/ai-recommend")}
                            className="bg-white border border-blue-500 text-blue-500 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50"
                        >
                            ✨ AI 추천받기
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.map((trip) => {
                        const tripDays = Math.floor(
                            (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1

                        const today = new Date()
                        const start = new Date(trip.start_date)
                        const end = new Date(trip.end_date)
                        const dday = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                        let status = ""
                        let statusColor = ""
                        if (today >= start && today <= end) {
                            status = "여행 중"
                            statusColor = "bg-green-500"
                        } else if (dday > 0) {
                            status = `D-${dday}`
                            statusColor = "bg-blue-500"
                        } else {
                            status = "완료"
                            statusColor = "bg-gray-400"
                        }

                        return (
                            <div
                                key={trip.id}
                                className="relative bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all"
                                onClick={() => router.push(`/trip/${trip.id}`)}
                            >
                                {/* 이미지 */}
                                <div className="relative">
                                    <img
                                        src={getCityImage(trip.city, trip.country)}
                                        alt={trip.title}
                                        className="w-full h-48 object-cover"
                                    />
                                    {/* 상태 배지 */}
                                    <span className={`absolute top-3 left-3 ${statusColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                                        {status}
                                    </span>
                                    {/* 삭제 버튼 */}
                                    {deletingId === trip.id ? (
                                        <div className="absolute top-3 right-3 flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id) }}
                                                className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold"
                                            >
                                                삭제
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeletingId(null) }}
                                                className="px-2 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition"
                                            onClick={(e) => { e.stopPropagation(); setDeletingId(trip.id) }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="text-xl font-bold truncate">{trip.title}</div>
                                    <div className="text-gray-500 text-sm mt-1">
                                        {trip.start_date} ~ {trip.end_date}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-2 text-sm text-gray-600">
                                            <span>🗓 {tripDays}일</span>
                                            <span>👤 {trip.people}명</span>
                                        </div>
                                        <button
                                            className="text-blue-500 font-semibold text-sm hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/trip/${trip.id}`)
                                            }}
                                        >
                                            상세보기 →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </main>
    )
}