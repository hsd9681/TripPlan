"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "../../../lib/api"
import { useTrip } from "../../../context/TripContext"
import { useSearchPanel } from "../../../context/SearchPanelContext"
import {
    GoogleMap,
    DirectionsRenderer,
    useJsApiLoader,
    Marker,
    InfoWindow,
} from "@react-google-maps/api"
import { toast } from "react-hot-toast"

export default function TripDetailPage() {
    const params = useParams()
    const tripId = Number(params.tripId)
    const router = useRouter()

    // 우측 패널 탭: 일정 / 예산 / 메모
    const [rightTab, setRightTab] = useState<"schedule" | "budget" | "memo">("schedule")

    const [selectedDay, setSelectedDay] = useState(1)
    const [directions, setDirections] = useState<any>(null)
    const [selectedMarker, setSelectedMarker] = useState<any>(null)

    // 예산 탭 상태
    const [totalBudget, setTotalBudget] = useState(1500000)
    const [budgetInput, setBudgetInput] = useState("1500000")
    const [trip, setTrip] = useState<any>(null)

    // 메모 탭 상태 (일자별 로컬 메모, 추후 백엔드 연동 가능)
    const [memos, setMemos] = useState<{ [day: number]: string }>({})

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    })

    const {
        schedule,
        setSchedule,
        setSelectedDay: setScheduleDay,
        setScheduleMode,
        editingIndex,
        setEditingIndex,
        setCurrentTrip,
    } = useTrip()

    const { openPanel } = useSearchPanel()

    const refreshTrip = async () => {
        const res = await api.get("/trip/upcoming")
        setCurrentTrip(res.data)
    }

    const createRoute = (day: number) => {
        const places = schedule[day] || []

        if (places.length < 2) {
            setDirections(null)
            return
        }

        const origin = { lat: places[0].lat, lng: places[0].lng }
        const destination = {
            lat: places[places.length - 1].lat,
            lng: places[places.length - 1].lng,
        }
        const waypoints = places.slice(1, places.length - 1).map((place: any) => ({
            location: { lat: place.lat, lng: place.lng },
            stopover: true,
        }))

        const directionsService = new google.maps.DirectionsService()

        directionsService
            .route({
                origin,
                destination,
                waypoints,
                optimizeWaypoints: false,
                travelMode: google.maps.TravelMode.WALKING,
            })
            .then((result) => {
                setDirections(result)
            })
    }

    useEffect(() => {
        api.get("me").then((res) => {
            console.log(schedule)
        })
    }, [])

    const calculateTime = (items: any[], index: number) => {
        let minutes = 9 * 60
        for (let i = 0; i < index; i++) {
            minutes += items[i].duration
        }
        const hour = Math.floor(minutes / 60)
        const minute = minutes % 60
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    }

    const removePlace = async (index: number) => {
        const place = schedule[selectedDay][index]
        await api.delete(`schedule/${place.id}`)

        const updatedSchedule = { ...schedule }
        updatedSchedule[selectedDay] = updatedSchedule[selectedDay].filter(
            (_: any, i: number) => i !== index
        )

        setSchedule(updatedSchedule)
        toast.success("일정이 삭제되었습니다.")
        await refreshTrip()
    }

    const moveUp = async (index: number) => {
        if (index === 0) return

        const updatedSchedule = { ...schedule }
        const daySchedule = [...updatedSchedule[selectedDay]]
            ;[daySchedule[index - 1], daySchedule[index]] = [
                daySchedule[index],
                daySchedule[index - 1],
            ]

        updatedSchedule[selectedDay] = daySchedule
        setSchedule(updatedSchedule)

        await api.put(
            "schedule/order",
            daySchedule.map((item: any, idx: number) => ({ id: item.id, order_no: idx + 1 }))
        )
        toast.success("일정 순서가 변경되었습니다.")
        await refreshTrip()
    }

    const moveDown = async (index: number) => {
        const daySchedule = schedule[selectedDay] || []
        if (index === daySchedule.length - 1) return

        const updatedSchedule = { ...schedule }
        const copied = [...daySchedule]
            ;[copied[index], copied[index + 1]] = [copied[index + 1], copied[index]]

        updatedSchedule[selectedDay] = copied
        setSchedule(updatedSchedule)

        await api.put(
            "schedule/order",
            copied.map((item: any, idx: number) => ({ id: item.id, order_no: idx + 1 }))
        )
        toast.success("일정 순서가 변경되었습니다.")
        await refreshTrip()
    }
    useEffect(() => {

    api
        .get(`trip/${tripId}`)
        .then((res) => {

            setTrip(res.data)

        })

}, [tripId])

    useEffect(() => {
        api.get(`schedule/${tripId}`).then((res) => {
            console.log("DB 응답", res.data)

            if (res.data.message === "unauthorized") {
                router.push("/login")
                return
            }

            if (res.data.message === "forbidden") {
                router.push("/trip/result")
                return
            }

            const grouped: any = {}
            res.data.forEach((item: any) => {
                grouped[item.day_number] ??= []
                grouped[item.day_number].push(item)
            })

            setSchedule(grouped)
        })
    }, [tripId])

    // 지도는 항상 표시되므로 selectedDay/schedule이 바뀔 때마다 경로 갱신
    useEffect(() => {
        createRoute(selectedDay)
    }, [selectedDay, schedule])

    const dayPlaces = schedule[selectedDay] || []

    // 경로 요약 (총 거리/시간) - directions가 있을 때만 계산
    let totalDistanceKm: number | null = null
    let totalDurationMin: number | null = null
    if (directions?.routes?.[0]?.legs) {
        const legs = directions.routes[0].legs
        totalDistanceKm = legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0) / 1000
        totalDurationMin = Math.round(
            legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0) / 60
        )
    }

    const formatWon = (n: number) => `¥${n.toLocaleString()}`

    const estimatedTotal = dayPlaces.reduce((sum: number, p: any) => sum + (p.cost || 0), 0)
    const remaining = totalBudget - estimatedTotal
    const progress =
        totalBudget > 0 ? Math.min(100, Math.round((estimatedTotal / totalBudget) * 100)) : 0

    const saveBudget = () => {
        const parsed = Number(budgetInput.replace(/[^0-9]/g, ""))
        if (!parsed) {
            toast.error("올바른 예산 금액을 입력해주세요.")
            return
        }
        setTotalBudget(parsed)
        toast.success("예산이 저장되었습니다.")
    }

    return (
        <main className="max-w-7xl mx-auto p-8">
            <div className="bg-white border border-[#ECEEF2] rounded-3xl p-6 md:p-8">

                {/* 상단 헤더 */}
                <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl"
                            aria-label="뒤로가기"
                        >
                            ‹
                        </button>

                        <h1 className="text-2xl font-bold">{trip?.title}</h1>

                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => toast("여행 이름 수정은 준비 중입니다.")}
                            aria-label="여행 이름 수정"
                        >
                            ✎
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toast("공유 기능은 준비 중입니다.")}
                            className="px-4 py-2 rounded-xl border border-[#ECEEF2] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            공유
                        </button>
                        <button
                            onClick={() => toast("삭제 기능은 준비 중입니다.")}
                            className="px-4 py-2 rounded-xl border border-[#ECEEF2] font-medium text-red-500 hover:bg-red-50"
                        >
                            삭제
                        </button>
                    </div>
                </div>

                {/* 본문: DAY 사이드바 | 지도+일정 | 우측 패널 */}
                <div className="flex gap-6 items-start">

                    {/* DAY 사이드바 */}
                    <div className="w-[140px] flex-shrink-0 border border-[#ECEEF2] rounded-2xl p-3 h-fit">
                        {[1, 2, 3, 4, 5].map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`w-full p-3 mb-2 rounded-xl text-left font-semibold transition ${
                                    selectedDay === day
                                        ? "bg-blue-500 text-white"
                                        : "border border-[#ECEEF2] bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                DAY {day}
                            </button>
                        ))}
                    </div>

                    {/* 가운데: 지도 + 일정 리스트 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">

                        {/* 지도 */}
                        <div className="border border-[#ECEEF2] rounded-2xl overflow-hidden">
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={{ width: "100%", height: "420px" }}
                                    zoom={13}
                                    center={{ lat: 35.6764, lng: 139.65 }}
                                >
                                    {directions && (
                                        <DirectionsRenderer
                                            directions={directions}
                                            options={{ suppressMarkers: true }}
                                        />
                                    )}

                                    {dayPlaces.map((place: any, index: number) => (
                                        <Marker
                                            key={index}
                                            position={{ lat: place.lat, lng: place.lng }}
                                            onClick={() => setSelectedMarker(place)}
                                        />
                                    ))}

                                    {selectedMarker && (
                                        <InfoWindow
                                            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                                            onCloseClick={() => setSelectedMarker(null)}
                                        >
                                            <div className="w-[200px]">
                                                {selectedMarker.photo && (
                                                    <img
                                                        src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedMarker.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`}
                                                        alt={selectedMarker.name}
                                                        className="w-full h-28 object-cover rounded-lg mb-2"
                                                    />
                                                )}
                                                <div className="font-bold text-lg">{selectedMarker.name}</div>
                                                <div className="text-sm text-gray-500">{selectedMarker.category}</div>
                                                {selectedMarker.rating && (
                                                    <div className="text-sm text-yellow-500 mt-1">
                                                        ★ {selectedMarker.rating}
                                                    </div>
                                                )}
                                            </div>
                                        </InfoWindow>
                                    )}
                                </GoogleMap>
                            )}
                        </div>

                        {/* 경로 다시 그리기 */}
                        <div className="flex justify-end -mt-2">
                            <button
                                onClick={() => createRoute(selectedDay)}
                                className="flex items-center gap-1 text-sm text-gray-600 border border-[#ECEEF2] bg-white rounded-full px-4 py-1.5 hover:bg-gray-50"
                            >
                                ↻ 경로 다시 그리기
                            </button>
                        </div>

                        {/* 일정 리스트 */}
                        <div className="border border-[#ECEEF2] rounded-2xl p-6">
                            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                                <h2 className="text-xl font-bold">DAY {selectedDay}</h2>
                                {totalDistanceKm !== null && totalDurationMin !== null && (
                                    <div className="text-sm text-gray-500">
                                        도보 {totalDistanceKm.toFixed(2)}km · 예상 소요시간{" "}
                                        {Math.floor(totalDurationMin / 60)}시간 {totalDurationMin % 60}분
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {dayPlaces.map((place: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 py-3 border-b border-[#F1F2F5] last:border-b-0"
                                    >
                                        {/* 드래그 핸들 (시각용) */}
                                        <span className="text-gray-300 select-none">⋮⋮</span>

                                        {/* 순번 배지 */}
                                        <span className="w-6 h-6 flex-shrink-0 rounded-full bg-orange-400 text-white text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>

                                        {place.photo && (
                                            <img
                                                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`}
                                                alt={place.name}
                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">{place.name}</div>
                                            <div className="text-xs text-gray-400">{place.category}</div>
                                        </div>

                                        <div className="text-sm text-gray-600 w-[110px] flex-shrink-0 text-right">
                                            {calculateTime(dayPlaces, index)} ~{" "}
                                            {(() => {
                                                let m = 9 * 60
                                                for (let i = 0; i <= index; i++) m += dayPlaces[i].duration
                                                return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
                                                    m % 60
                                                ).padStart(2, "0")}`
                                            })()}
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    setEditingIndex(index)
                                                    setScheduleDay(selectedDay)
                                                    openPanel()
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50"
                                                aria-label="일정 수정"
                                            >
                                                ✏
                                            </button>
                                            <button
                                                onClick={() => moveUp(index)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                                                aria-label="위로 이동"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveDown(index)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                                                aria-label="아래로 이동"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => removePlace(index)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                aria-label="일정 삭제"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setScheduleDay(selectedDay)
                                    setScheduleMode(true)
                                    openPanel()
                                }}
                                className="w-full mt-4 border border-[#ECEEF2] rounded-xl py-3 text-blue-500 font-semibold hover:bg-blue-50"
                            >
                                + 장소 추가
                            </button>
                        </div>
                    </div>

                    {/* 우측 패널 */}
                    <div className="w-[380px] flex-shrink-0 border border-[#ECEEF2] rounded-2xl p-5">

                        {/* 탭 */}
                        <div className="flex border-b border-[#ECEEF2] mb-5">
                            {([
                                { key: "schedule", label: "일정" },
                                { key: "budget", label: "예산" },
                                { key: "memo", label: "메모" },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setRightTab(tab.key)}
                                    className={`flex-1 pb-3 font-semibold transition border-b-2 ${
                                        rightTab === tab.key
                                            ? "text-blue-600 border-blue-600"
                                            : "text-gray-400 border-transparent"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 일정 탭: 해당 일자 요약 */}
                        {rightTab === "schedule" && (
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500">DAY {selectedDay} 요약</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-[#ECEEF2] rounded-xl p-4">
                                        <div className="text-xs text-gray-500">방문 장소</div>
                                        <div className="text-xl font-bold mt-1">{dayPlaces.length}곳</div>
                                    </div>
                                    <div className="border border-[#ECEEF2] rounded-xl p-4">
                                        <div className="text-xs text-gray-500">총 소요시간</div>
                                        <div className="text-xl font-bold mt-1">
                                            {Math.floor(
                                                dayPlaces.reduce((s: number, p: any) => s + (p.duration || 0), 0) / 60
                                            )}
                                            시간{" "}
                                            {dayPlaces.reduce((s: number, p: any) => s + (p.duration || 0), 0) % 60}분
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {dayPlaces.map((place: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 text-sm border border-[#F1F2F5] rounded-lg px-3 py-2"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="truncate">{place.name}</span>
                                        </div>
                                    ))}
                                    {dayPlaces.length === 0 && (
                                        <div className="text-sm text-gray-400">등록된 일정이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 예산 탭 */}
                        {rightTab === "budget" && (
                            <div className="space-y-5">
                                <div>
                                    <div className="text-sm text-gray-500 mb-2">총 여행 예산</div>
                                    <div className="flex gap-2">
                                        <input
                                            value={budgetInput}
                                            onChange={(e) => setBudgetInput(e.target.value)}
                                            className="flex-1 border border-[#ECEEF2] rounded-xl px-3 py-2 text-lg font-semibold outline-none focus:border-blue-400"
                                        />
                                        <button
                                            onClick={saveBudget}
                                            className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600"
                                        >
                                            저장
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border border-[#ECEEF2] rounded-xl p-4 text-center">
                                    <div>
                                        <div className="text-xs text-gray-500">예상 사용</div>
                                        <div className="text-orange-500 font-bold mt-1">
                                            {formatWon(estimatedTotal)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">잔여 예산</div>
                                        <div className="text-green-600 font-bold mt-1">{formatWon(remaining)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">진행률</div>
                                        <div className="text-blue-600 font-bold mt-1">{progress}%</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {progress}% ({estimatedTotal.toLocaleString()} / {totalBudget.toLocaleString()}원)
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                                        지출 내역 (일정 기반)
                                        <span className="text-gray-300" title="해당 일자 일정의 예상 비용 합계입니다">
                                            ⓘ
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {dayPlaces.map((place: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <span className="truncate">{place.name}</span>
                                                </div>
                                                <span className="text-gray-700 flex-shrink-0">
                                                    {formatWon(place.cost || 0)}
                                                </span>
                                            </div>
                                        ))}
                                        {dayPlaces.length === 0 && (
                                            <div className="text-sm text-gray-400">등록된 일정이 없습니다.</div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[#ECEEF2] mt-3 pt-3 font-semibold">
                                        <span>총 예상 사용 금액</span>
                                        <span className="text-orange-500">{formatWon(estimatedTotal)}</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-4 flex items-start justify-between gap-3">
                                    <div className="text-sm text-gray-600 flex gap-2">
                                        <span>💡</span>
                                        <span>각 일정의 예상 비용을 입력하면 더 정확한 예산 관리를 할 수 있어요!</span>
                                    </div>
                                    <button
                                        onClick={() => toast("비용 입력 기능은 준비 중입니다.")}
                                        className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold flex-shrink-0 hover:bg-blue-600"
                                    >
                                        비용 입력하기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 메모 탭 */}
                        {rightTab === "memo" && (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-500">DAY {selectedDay} 메모</div>
                                <textarea
                                    value={memos[selectedDay] || ""}
                                    onChange={(e) =>
                                        setMemos({ ...memos, [selectedDay]: e.target.value })
                                    }
                                    placeholder="이 날의 메모를 남겨보세요 (예: 예약 정보, 준비물 등)"
                                    className="w-full h-64 border border-[#ECEEF2] rounded-xl p-3 text-sm outline-none focus:border-blue-400 resize-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}