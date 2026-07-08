"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"
import { toast } from "react-hot-toast"
import { useTrip } from "../../../context/TripContext"

type Step = "input" | "loading" | "done"

const LOADING_MESSAGES = [
    "🤖 AI가 최적의 여행 코스를 분석하고 있어요...",
    "📍 실제 명소 정보를 수집하고 있어요...",
    "🗺️ 동선을 최적화하고 있어요...",
    "✨ 거의 다 됐어요!",
]

export default function AiRecommendPage() {
    const router = useRouter()

    const [step, setStep] = useState<Step>("input")
    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [people, setPeople] = useState(1)
    const [resultTitle, setResultTitle] = useState("")
    const [loadingIdx, setLoadingIdx] = useState(0)
    const { setCurrentTrip } = useTrip()

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
        if (totalDays > 14) {
            toast.error("최대 14일까지 추천 가능합니다.")
            return
        }

        setStep("loading")

        let idx = 0
        const timer = setInterval(() => {
            idx = (idx + 1) % LOADING_MESSAGES.length
            setLoadingIdx(idx)
        }, 2500)

        try {
            const res = await api.post("/trip/ai-recommend", {
                country,
                city,
                start_date: startDate,
                end_date: endDate,
                people,
            })

            clearInterval(timer)

            if (res.data.message) {
                toast.error("AI 추천 생성에 실패했습니다. 다시 시도해주세요.")
                setStep("input")
                return
            }

            setResultTitle(res.data.title)
            setStep("done")

            // 생성된 여행을 currentTrip에 바로 반영
            try {
                const upcoming = await api.get("/trip/upcoming")
                setCurrentTrip(upcoming.data)
            } catch { }

            setTimeout(() => {
                router.push("/")  // result 대신 홈으로 이동
            }, 1500)

        } catch {
            clearInterval(timer)
            toast.error("오류가 발생했습니다. 다시 시도해주세요.")
            setStep("input")
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">

                {/* 입력 단계 */}
                {step === "input" && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#ECEEF2]">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 text-sm"
                        >
                            ‹ 뒤로
                        </button>

                        <div className="mb-8">
                            <h1 className="text-2xl font-bold">✨ AI 추천 코스</h1>
                            <p className="text-gray-500 mt-1 text-sm">
                                여행 정보를 입력하면 AI가 최적의 일정을 만들어드려요
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">국가</label>
                                <input
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="예) 일본"
                                    className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">도시</label>
                                <input
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="예) 도쿄"
                                    className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                                />
                            </div>

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

                            {totalDays > 0 && (
                                <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-sm text-blue-600 font-medium">
                                    총 {totalDays}일 여행 ({totalDays - 1}박 {totalDays}일)
                                </div>
                            )}

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
                            className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition text-base"
                        >
                            ✨ AI 일정 생성하기
                        </button>
                    </div>
                )}

                {/* 로딩 단계 */}
                {step === "loading" && (
                    <div className="bg-white rounded-3xl p-12 shadow-sm border border-[#ECEEF2] text-center">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-xl font-bold mb-2">{city} 여행 코스 생성 중</h2>
                        <p className="text-gray-500 text-sm min-h-[20px]">
                            {LOADING_MESSAGES[loadingIdx]}
                        </p>
                        <div className="mt-8 bg-blue-50 rounded-2xl p-4 text-sm text-blue-600 leading-relaxed">
                            AI가 실제 명소 정보를 수집하고 있어요.<br />
                            30초 ~ 1분 정도 소요될 수 있어요.
                        </div>
                    </div>
                )}

                {/* 완료 단계 */}
                {step === "done" && (
                    <div className="bg-white rounded-3xl p-12 shadow-sm border border-[#ECEEF2] text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-xl font-bold mb-2">일정이 완성됐어요!</h2>
                        <p className="text-gray-500 text-sm">{resultTitle}</p>
                        <p className="text-blue-500 text-sm mt-6 animate-pulse">
                            여행 목록으로 이동 중...
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}