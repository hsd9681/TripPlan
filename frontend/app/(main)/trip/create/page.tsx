"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"
import { toast } from "react-hot-toast"
import { useTrip } from "../../../context/TripContext"

export default function TripCreatePage() {
    const router = useRouter()
    const { setCurrentTrip } = useTrip()

    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [people, setPeople] = useState(1)
    const [loading, setLoading] = useState(false)

    const totalDays =
        startDate && endDate
            ? Math.floor(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
              ) + 1
            : 0

    const handleSubmit = async () => {
        if (!country.trim() || !city.trim() || !startDate || !endDate) {
            toast.error("모든 항목을 입력해주세요.")
            return
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error("종료일은 시작일 이후여야 합니다.")
            return
        }

        setLoading(true)
        try {
            const res = await api.post("/trip", {
                title: `${city} 여행`,
                country,
                city,
                start_date: startDate,
                end_date: endDate,
                people,
            })

            // currentTrip 업데이트
            try {
                const upcoming = await api.get("/trip/upcoming")
                setCurrentTrip(upcoming.data)
            } catch {}

            toast.success("여행이 생성되었습니다!")
            router.push(`/trip/${res.data.id}`)
        } catch {
            toast.error("여행 생성에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#ECEEF2]">

                    <button
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 text-sm"
                    >
                        ‹ 뒤로
                    </button>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">✈️ 새 여행 계획</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            여행 정보를 입력하고 직접 일정을 계획해보세요
                        </p>
                    </div>

                    <div className="space-y-4">

                        {/* 국가 */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">국가</label>
                            <input
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="예) 일본"
                                className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                            />
                        </div>

                        {/* 도시 */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">도시</label>
                            <input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="예) 도쿄"
                                className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                            />
                        </div>

                        {/* 날짜 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">시작일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">종료일</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                                />
                            </div>
                        </div>

                        {/* 여행 기간 표시 */}
                        {totalDays > 0 && (
                            <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-sm text-blue-600 font-medium">
                                총 {totalDays}일 여행 ({totalDays - 1}박 {totalDays}일)
                            </div>
                        )}

                        {/* 인원 */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">인원</label>
                            <div className="flex items-center border border-[#ECEEF2] rounded-xl px-4 py-3 gap-4">
                                <button
                                    onClick={() => setPeople((p) => Math.max(1, p - 1))}
                                    className="w-8 h-8 rounded-full border border-[#ECEEF2] text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
                                >
                                    -
                                </button>
                                <span className="flex-1 text-center font-semibold text-base">{people}명</span>
                                <button
                                    onClick={() => setPeople((p) => Math.min(20, p + 1))}
                                    className="w-8 h-8 rounded-full border border-[#ECEEF2] text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition text-base disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                생성 중...
                            </span>
                        ) : "✈️ 여행 만들기"}
                    </button>

                    {/* AI 추천 안내 */}
                    <div className="mt-4 text-center text-sm text-gray-400">
                        일정 계획이 어렵다면?{" "}
                        <button
                            onClick={() => router.push("/trip/ai-recommend")}
                            className="text-blue-500 font-semibold hover:underline"
                        >
                            ✨ AI 추천 코스 사용하기
                        </button>
                    </div>

                </div>
            </div>
        </main>
    )
}