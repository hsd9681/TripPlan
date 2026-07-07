"use client"

import { useEffect, useState, useRef } from "react"
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
    const rawId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId
    const tripId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 0
    const router = useRouter()

    const [rightTab, setRightTab] = useState<"schedule" | "budget" | "memo">("schedule")
    const [selectedDay, setSelectedDay] = useState(1)
    const [directions, setDirections] = useState<any>(null)
    const [selectedMarker, setSelectedMarker] = useState<any>(null)

    // GPS 상태
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
    const [mapCenter, setMapCenter] = useState({ lat: 35.6764, lng: 139.65 })

    const [tripInfo, setTripInfo] = useState<any>(null)
    const totalDays = tripInfo
        ? Math.floor(
            (new Date(tripInfo.end_date).getTime() - new Date(tripInfo.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
        : 5
    const [totalBudget, setTotalBudget] = useState(0)
    const [budgetInput, setBudgetInput] = useState("0")
    const [budgetSaving, setBudgetSaving] = useState(false)


    // 환율 상태
    const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({})
    const [exchangeLoading, setExchangeLoading] = useState(false)
    const [krwAmount, setKrwAmount] = useState("")
    const [targetCurrency, setTargetCurrency] = useState("JPY")
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

    const [costInputs, setCostInputs] = useState<{ [id: number]: string }>({})
    const [costSaving, setCostSaving] = useState<{ [id: number]: boolean }>({})

    const [memos, setMemos] = useState<{ [day: number]: string }>({})
    const [memoSaving, setMemoSaving] = useState(false)
    const memoTimerRef = useRef<{ [day: number]: ReturnType<typeof setTimeout> }>({})

    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleInput, setTitleInput] = useState("")

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    })

    const {
        schedule,
        setSchedule,
        setSelectedDay: setScheduleDay,
        setScheduleMode,
        setEditingIndex,
        setCurrentTrip,
    } = useTrip()

    const { openPanel } = useSearchPanel()

    const refreshTrip = async () => {
        const res = await api.get("/trip/upcoming")
        setCurrentTrip(res.data)
    }

    // ── 여행 삭제 ──
    const deleteTrip = async () => {
        if (!confirm("정말 이 여행을 삭제하시겠습니까?\n삭제된 여행은 복구할 수 없습니다.")) return
        try {
            await api.delete(`/trip/${tripId}`)
            toast.success("여행이 삭제되었습니다.")
            router.push("/trip/result")
        } catch {
            toast.error("삭제에 실패했습니다.")
        }
    }

    // ── 여행 이름 수정 ──
    const saveTitle = async () => {
        if (!titleInput.trim()) { toast.error("여행 이름을 입력해주세요."); return }
        try {
            await api.put(`/trip/${tripId}/title`, { title: titleInput.trim() })
            setTripInfo((prev: any) => ({ ...prev, title: titleInput.trim() }))
            setIsEditingTitle(false)
            toast.success("여행 이름이 수정되었습니다.")
        } catch {
            toast.error("수정에 실패했습니다.")
        }
    }

    useEffect(() => {
        if (!tripId || tripId === 0) return

        api.get(`/trip/${tripId}`).then((res) => {
            if (res.data.message === "unauthorized") { router.push("/login"); return }
            if (res.data.message === "forbidden") { router.push("/trip/result"); return }
            setTripInfo(res.data)
            const b = res.data.budget ?? 0
            setTotalBudget(b)
            setBudgetInput(String(b))
        })

        api.get(`/schedule/${tripId}`).then((res) => {
            if (res.data.message === "unauthorized") { router.push("/login"); return }
            if (res.data.message === "forbidden") { router.push("/trip/result"); return }

            const grouped: any = {}
            res.data.forEach((item: any) => {
                if (item.name === "__memo__") return
                grouped[item.day_number] ??= []
                grouped[item.day_number].push(item)
            })
            setSchedule(grouped)

            const initCosts: { [id: number]: string } = {}
            res.data.forEach((item: any) => {
                if (item.name !== "__memo__") {
                    initCosts[item.id] = String(item.cost ?? 0)
                }
            })
            setCostInputs(initCosts)
        })
    }, [tripId])

    useEffect(() => {
        if (!tripId || tripId === 0) return
        if (rightTab !== "memo") return
        if (memos[selectedDay] !== undefined) return
        api.get(`/trip/${tripId}/day-memo/${selectedDay}`).then((res) => {
            setMemos((prev) => ({ ...prev, [selectedDay]: res.data.memo ?? "" }))
        })
    }, [rightTab, selectedDay, tripId])

    useEffect(() => {
        if (rightTab === "budget") {
            loadExchangeRates()
        }
    }, [rightTab])

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("GPS를 지원하지 않는 브라우저예요.")
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }
                setUserLocation(loc)
                setMapCenter(loc)  // ← 추가
                if (mapInstance) {
                    mapInstance.panTo(loc)
                    mapInstance.setZoom(15)
                }
                toast.success("현재 위치를 찾았어요!")
                setLocating(false)
            },
            () => {
                toast.error("위치 정보를 가져올 수 없어요.")
                setLocating(false)
            },
            { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
        )
    }

    const createRoute = (day: number) => {
        const places = schedule[day] || []
        if (places.length < 2) { setDirections(null); return }

        const origin = { lat: places[0].lat, lng: places[0].lng }
        const destination = { lat: places[places.length - 1].lat, lng: places[places.length - 1].lng }
        const waypoints = places.slice(1, places.length - 1).map((p: any) => ({
            location: { lat: p.lat, lng: p.lng },
            stopover: true,
        }))

        new google.maps.DirectionsService()
            .route({ origin, destination, waypoints, optimizeWaypoints: false, travelMode: google.maps.TravelMode.WALKING })
            .then((result) => setDirections(result))
            .catch(() => setDirections(null))
    }

    useEffect(() => { createRoute(selectedDay) }, [selectedDay, schedule])

    const calculateTime = (items: any[], index: number) => {
        let minutes = 9 * 60
        for (let i = 0; i < index; i++) minutes += items[i].duration
        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
    }

    const calculateEndTime = (items: any[], index: number) => {
        let minutes = 9 * 60
        for (let i = 0; i <= index; i++) minutes += items[i].duration
        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
    }

    const removePlace = async (index: number) => {
        const place = schedule[selectedDay][index]
        await api.delete(`/schedule/${place.id}`)
        const updated = { ...schedule }
        updated[selectedDay] = updated[selectedDay].filter((_: any, i: number) => i !== index)
        setSchedule(updated)
        toast.success("일정이 삭제되었습니다.")
        await refreshTrip()
    }

    const moveUp = async (index: number) => {
        if (index === 0) return
        const updated = { ...schedule }
        const day = [...updated[selectedDay]]
            ;[day[index - 1], day[index]] = [day[index], day[index - 1]]
        updated[selectedDay] = day
        setSchedule(updated)
        await api.put("/schedule/order", day.map((item: any, idx: number) => ({ id: item.id, order_no: idx + 1 })))
        toast.success("순서가 변경되었습니다.")
        await refreshTrip()
    }

    const moveDown = async (index: number) => {
        const day = schedule[selectedDay] || []
        if (index === day.length - 1) return
        const updated = { ...schedule }
        const copied = [...day]
            ;[copied[index], copied[index + 1]] = [copied[index + 1], copied[index]]
        updated[selectedDay] = copied
        setSchedule(updated)
        await api.put("/schedule/order", copied.map((item: any, idx: number) => ({ id: item.id, order_no: idx + 1 })))
        toast.success("순서가 변경되었습니다.")
        await refreshTrip()
    }

    // 환율 로드
    const loadExchangeRates = async () => {
        if (Object.keys(exchangeRates).length > 0) return // 이미 로드됨
        setExchangeLoading(true)
        try {
            const res = await fetch("https://api.exchangerate-api.com/v4/latest/KRW")
            const data = await res.json()
            setExchangeRates(data.rates)
        } catch {
            toast.error("환율 정보를 불러오지 못했습니다.")
        } finally {
            setExchangeLoading(false)
        }
    }

    // 환율 변환
    const convertCurrency = () => {
        const amount = Number(krwAmount.replace(/[^0-9]/g, ""))
        if (!amount || !exchangeRates[targetCurrency]) return
        const rate = exchangeRates[targetCurrency]
        setConvertedAmount(Math.round(amount * rate * 100) / 100)
    }

    const saveBudget = async () => {
        const parsed = Number(budgetInput.replace(/[^0-9]/g, ""))
        if (isNaN(parsed)) { toast.error("올바른 금액을 입력해주세요."); return }
        setBudgetSaving(true)
        try {
            await api.put(`/trip/${tripId}/budget`, { budget: parsed })
            setTotalBudget(parsed)
            toast.success("예산이 저장되었습니다.")
        } catch {
            toast.error("저장에 실패했습니다.")
        } finally {
            setBudgetSaving(false)
        }
    }

    const saveCost = async (scheduleId: number) => {
        const parsed = Number((costInputs[scheduleId] ?? "0").replace(/[^0-9]/g, ""))
        setCostSaving((prev) => ({ ...prev, [scheduleId]: true }))
        try {
            await api.put(`/schedule/${scheduleId}/cost`, { cost: parsed })
            const updated = { ...schedule }
            updated[selectedDay] = updated[selectedDay].map((p: any) =>
                p.id === scheduleId ? { ...p, cost: parsed } : p
            )
            setSchedule(updated)
            toast.success("비용이 저장되었습니다.")
        } catch {
            toast.error("저장에 실패했습니다.")
        } finally {
            setCostSaving((prev) => ({ ...prev, [scheduleId]: false }))
        }
    }

    const handleMemoChange = (day: number, text: string) => {
        setMemos((prev) => ({ ...prev, [day]: text }))
        if (memoTimerRef.current[day]) clearTimeout(memoTimerRef.current[day])
        memoTimerRef.current[day] = setTimeout(async () => {
            setMemoSaving(true)
            try {
                await api.put(`/trip/${tripId}/day-memo`, { day_number: day, memo: text })
                toast.success("메모가 저장되었습니다.")
            } catch {
                toast.error("메모 저장에 실패했습니다.")
            } finally {
                setMemoSaving(false)
            }
        }, 1000)
    }

    const dayPlaces = (schedule[selectedDay] || []) as any[]
    const allPlaces = Object.values(schedule).flat() as any[]
    const totalUsed = allPlaces.reduce((sum: number, p: any) => sum + (p.cost ?? 0), 0)
    const remaining = totalBudget - totalUsed
    const progress = totalBudget > 0 ? Math.min(100, Math.round((totalUsed / totalBudget) * 100)) : 0
    const dayUsed = dayPlaces.reduce((sum: number, p: any) => sum + (p.cost ?? 0), 0)

    let totalDistanceKm: number | null = null
    let totalDurationMin: number | null = null
    if (directions?.routes?.[0]?.legs) {
        const legs = directions.routes[0].legs
        totalDistanceKm = legs.reduce((s: number, l: any) => s + l.distance.value, 0) / 1000
        totalDurationMin = Math.round(legs.reduce((s: number, l: any) => s + l.duration.value, 0) / 60)
    }

    if (!tripId || tripId === 0) {
        return (
            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white border border-[#ECEEF2] rounded-3xl p-12 text-center">
                    <p className="text-gray-400">잘못된 접근입니다.</p>
                    <button
                        onClick={() => router.push("/trip/result")}
                        className="mt-4 text-blue-500 hover:underline text-sm"
                    >
                        여행 목록으로 돌아가기
                    </button>
                </div>
            </main>
        )
    }

    if (!tripInfo) {
        return (
            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white border border-[#ECEEF2] rounded-3xl p-12 text-center">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">불러오는 중...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="max-w-7xl mx-auto p-6">
            <div className="bg-white border border-[#ECEEF2] rounded-3xl p-6">

                {/* 헤더 */}
                <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl"
                        >
                            ‹
                        </button>

                        {/* 여행 이름 — 수정 모드 / 표시 모드 */}
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") saveTitle()
                                        if (e.key === "Escape") setIsEditingTitle(false)
                                    }}
                                    autoFocus
                                    className="text-2xl font-bold border-b-2 border-blue-500 outline-none bg-transparent w-64"
                                />
                                <button
                                    onClick={saveTitle}
                                    className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => setIsEditingTitle(false)}
                                    className="px-3 py-1.5 rounded-lg border border-[#ECEEF2] text-sm text-gray-500 hover:bg-gray-50"
                                >
                                    취소
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div>
                                    <h1 className="text-2xl font-bold">{tripInfo?.title ?? "여행 상세"}</h1>
                                    {tripInfo && (
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {tripInfo.start_date} ~ {tripInfo.end_date} · 성인 {tripInfo.people}명
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setTitleInput(tripInfo?.title ?? "")
                                        setIsEditingTitle(true)
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-lg"
                                    title="여행 이름 수정"
                                >
                                    ✎
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/trip/${tripId}`
                                navigator.clipboard.writeText(url)
                                    .then(() => toast.success("링크가 클립보드에 복사되었습니다."))
                                    .catch(() => toast.error("복사에 실패했습니다."))
                            }}
                            className="px-4 py-2 rounded-xl border border-[#ECEEF2] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            공유
                        </button>
                        {/* 삭제 버튼 — 실제 동작 연결 */}
                        <button
                            onClick={deleteTrip}
                            className="px-4 py-2 rounded-xl border border-[#ECEEF2] font-medium text-red-500 hover:bg-red-50"
                        >
                            삭제
                        </button>
                    </div>
                </div>

                <div className="flex gap-5 items-start">

                    {/* DAY 사이드바 */}
                    <div className="w-[130px] flex-shrink-0 border border-[#ECEEF2] rounded-2xl p-2.5">
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`w-full p-3 mb-1.5 rounded-xl text-left font-semibold text-sm transition last:mb-0 ${selectedDay === day ? "bg-blue-500 text-white" : "border border-[#ECEEF2] bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                DAY {day}
                            </button>
                        ))}
                    </div>

                    {/* 가운데: 지도 + 일정 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">

                        {/* 지도 */}
                        <div className="border border-[#ECEEF2] rounded-2xl overflow-hidden relative">
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={{ width: "100%", height: "400px" }}
                                    zoom={13}
                                    center={mapCenter}  // ← state로 변경
                                    onLoad={(map) => setMapInstance(map)}
                                >
                                    {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
                                    {dayPlaces.map((place: any, index: number) => (
                                        <Marker
                                            key={index}
                                            position={{ lat: place.lat, lng: place.lng }}
                                            onClick={() => setSelectedMarker(place)}
                                            label={{
                                                text: String(index + 1),
                                                color: "#ffffff",
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                            }}
                                            icon={{
                                                path: google.maps.SymbolPath.CIRCLE,
                                                scale: 18,
                                                fillColor: "#F97316",   // 주황색 (일정 번호 배지와 동일)
                                                fillOpacity: 1,
                                                strokeColor: "#ffffff",
                                                strokeWeight: 2,
                                            }}
                                        />
                                    ))}

                                    {/* 현재 위치 마커 */}
                                    {userLocation && (
                                        <Marker
                                            position={userLocation}
                                            icon={{
                                                path: google.maps.SymbolPath.CIRCLE,
                                                scale: 10,
                                                fillColor: "#4285F4",
                                                fillOpacity: 1,
                                                strokeColor: "#ffffff",
                                                strokeWeight: 3,
                                            }}
                                            title="현재 위치"
                                        />
                                    )}

                                    {selectedMarker && (
                                        <InfoWindow position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }} onCloseClick={() => setSelectedMarker(null)}>
                                            <div className="w-[200px]">
                                                {selectedMarker.photo && (
                                                    <img src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedMarker.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`} alt={selectedMarker.name} className="w-full h-28 object-cover rounded-lg mb-2" />
                                                )}
                                                <div className="font-bold">{selectedMarker.name}</div>
                                                <div className="text-sm text-gray-500">{selectedMarker.category}</div>
                                                {selectedMarker.rating && <div className="text-sm text-yellow-500 mt-1">★ {selectedMarker.rating}</div>}
                                            </div>
                                        </InfoWindow>
                                    )}
                                </GoogleMap>
                            )}

                            {/* 지도 위 버튼들 */}
                            <div className="absolute bottom-3 right-3 flex flex-col gap-2">

                                {/* GPS 버튼 */}
                                <button
                                    onClick={getCurrentLocation}
                                    disabled={locating}
                                    title="현재 위치"
                                    className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-lg transition ${locating
                                        ? "bg-white text-gray-400"
                                        : userLocation
                                            ? "bg-blue-500 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {locating ? (
                                        <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                    ) : "📍"}
                                </button>

                                {/* 경로 다시 그리기 버튼 */}
                                <button
                                    onClick={() => createRoute(selectedDay)}
                                    className="flex items-center gap-1 text-sm text-gray-600 border border-[#ECEEF2] bg-white rounded-xl px-3 py-2 hover:bg-gray-50 shadow-md"
                                >
                                    ↻ 경로
                                </button>

                            </div>
                        </div>

                        {/* 일정 리스트 */}
                        <div className="border border-[#ECEEF2] rounded-2xl p-5">
                            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                                <h2 className="text-lg font-bold">DAY {selectedDay}</h2>
                                {totalDistanceKm !== null && totalDurationMin !== null && (
                                    <span className="text-sm text-gray-400">도보 {totalDistanceKm.toFixed(2)}km · 예상 {Math.floor(totalDurationMin / 60)}시간 {totalDurationMin % 60}분</span>
                                )}
                            </div>
                            <div className="space-y-0">
                                {dayPlaces.map((place: any, index: number) => (
                                    <div key={place.id} className="flex items-center gap-3 py-3 border-b border-[#F1F2F5] last:border-b-0">
                                        <span className="text-gray-300 select-none text-xs">⋮⋮</span>
                                        <span className="w-6 h-6 flex-shrink-0 rounded-full bg-orange-400 text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                                        {place.photo && (
                                            <img src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`} alt={place.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate">{place.name}</div>
                                            <div className="text-xs text-gray-400">{place.category}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 flex-shrink-0">
                                            {calculateTime(dayPlaces, index)} ~ {calculateEndTime(dayPlaces, index)}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => { setEditingIndex(index); setScheduleDay(selectedDay); openPanel() }} className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 text-sm">✏</button>
                                            <button onClick={() => moveUp(index)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-sm">↑</button>
                                            <button onClick={() => moveDown(index)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-sm">↓</button>
                                            <button onClick={() => removePlace(index)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-400 text-sm">🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setScheduleDay(selectedDay); setScheduleMode(true); openPanel() }} className="w-full mt-4 border border-[#ECEEF2] rounded-xl py-3 text-blue-500 font-semibold hover:bg-blue-50 text-sm">
                                + 장소 추가
                            </button>
                        </div>
                    </div>

                    {/* 우측 패널 */}
                    <div className="w-[400px] flex-shrink-0 border border-[#ECEEF2] rounded-2xl p-5">
                        <div className="flex border-b border-[#ECEEF2] mb-5">
                            {(["schedule", "budget", "memo"] as const).map((tab) => (
                                <button key={tab} onClick={() => setRightTab(tab)} className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${rightTab === tab ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent"}`}>
                                    {tab === "schedule" ? "일정" : tab === "budget" ? "예산" : "메모"}
                                </button>
                            ))}
                        </div>

                        {/* 일정 탭 */}
                        {rightTab === "schedule" && (
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 font-medium">DAY {selectedDay} 요약</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-[#ECEEF2] rounded-xl p-3">
                                        <div className="text-xs text-gray-400">방문 장소</div>
                                        <div className="text-xl font-bold mt-1">{dayPlaces.length}곳</div>
                                    </div>
                                    <div className="border border-[#ECEEF2] rounded-xl p-3">
                                        <div className="text-xs text-gray-400">총 소요시간</div>
                                        <div className="text-xl font-bold mt-1">
                                            {Math.floor(dayPlaces.reduce((s: number, p: any) => s + (p.duration || 0), 0) / 60)}h {dayPlaces.reduce((s: number, p: any) => s + (p.duration || 0), 0) % 60}m
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {dayPlaces.map((place: any, i: number) => (
                                        <div key={place.id} className="flex items-center gap-2 text-sm border border-[#F1F2F5] rounded-lg px-3 py-2">
                                            <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                            <span className="truncate">{place.name}</span>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{place.duration}분</span>
                                        </div>
                                    ))}
                                    {dayPlaces.length === 0 && <div className="text-sm text-gray-400 text-center py-6">등록된 일정이 없습니다.</div>}
                                </div>
                            </div>
                        )}

                        {/* 예산 탭 */}
                        {rightTab === "budget" && (
                            <div className="space-y-5">
                                <div>
                                    <div className="text-sm font-semibold text-gray-700 mb-2">총 여행 예산</div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex items-center border border-[#ECEEF2] rounded-xl px-3 gap-1">
                                            <input
                                                value={budgetInput}
                                                onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9]/g, ""))}
                                                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                                                className="flex-1 py-2.5 text-lg font-semibold outline-none bg-transparent"
                                                placeholder="0"
                                            />
                                            <span className="text-gray-400 text-sm">원</span>
                                        </div>
                                        <button onClick={saveBudget} disabled={budgetSaving} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 text-sm">
                                            {budgetSaving ? "..." : "저장"}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border border-[#ECEEF2] rounded-xl p-4 text-center">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">예상 사용</div>
                                        <div className="text-sm font-bold text-orange-500">{totalUsed.toLocaleString()}원</div>
                                    </div>
                                    <div className="border-x border-[#ECEEF2]">
                                        <div className="text-xs text-gray-400 mb-1">잔여 예산</div>
                                        <div className={`text-sm font-bold ${remaining < 0 ? "text-red-500" : "text-green-600"}`}>{remaining.toLocaleString()}원</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">진행률</div>
                                        <div className="text-sm font-bold text-blue-600">{progress}%</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${progress > 90 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{progress}% ({totalUsed.toLocaleString()} / {totalBudget.toLocaleString()}원)</div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-semibold text-gray-700">DAY {selectedDay} 지출 내역</div>
                                        <div className="text-xs text-gray-400">비용을 직접 입력하세요</div>
                                    </div>
                                    {dayPlaces.length === 0 ? (
                                        <div className="text-sm text-gray-400 text-center py-4">등록된 일정이 없습니다.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {dayPlaces.map((place: any, i: number) => (
                                                <div key={place.id} className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                                    <span className="flex-1 text-xs truncate">{place.name}</span>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <div className="flex items-center border border-[#ECEEF2] rounded-lg px-2 py-1 gap-1">
                                                            <input
                                                                value={costInputs[place.id] ?? "0"}
                                                                onChange={(e) => setCostInputs((prev) => ({ ...prev, [place.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                                                                onKeyDown={(e) => e.key === "Enter" && saveCost(place.id)}
                                                                className="w-16 text-xs font-semibold outline-none text-right"
                                                            />
                                                            <span className="text-xs text-gray-400">원</span>
                                                        </div>
                                                        <button onClick={() => saveCost(place.id)} disabled={costSaving[place.id]} className="text-xs px-2 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
                                                            {costSaving[place.id] ? "..." : "저장"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between border-t border-[#ECEEF2] mt-3 pt-3">
                                        <span className="text-xs text-gray-500">DAY {selectedDay} 소계</span>
                                        <span className="text-sm font-bold text-orange-500">{dayUsed.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500">전체 합계</span>
                                        <span className="text-sm font-bold text-gray-700">{totalUsed.toLocaleString()}원</span>
                                    </div>
                                </div>

                                {totalBudget === 0 && (
                                    <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2 text-sm text-gray-600">
                                        <span>💡</span>
                                        <span>총 예산을 먼저 입력하고 저장하면 진행률을 확인할 수 있어요!</span>
                                    </div>
                                )}
                                {/* 환율 계산기 */}
                                <div className="border border-[#ECEEF2] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-semibold text-gray-700">환율 계산기</div>
                                        {exchangeLoading && (
                                            <span className="text-xs text-blue-400 animate-pulse">환율 로딩 중...</span>
                                        )}
                                        {!exchangeLoading && Object.keys(exchangeRates).length > 0 && (
                                            <span className="text-xs text-gray-400">실시간 환율 기준</span>
                                        )}
                                    </div>

                                    {/* 통화 선택 */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {[
                                            { code: "JPY", label: "🇯🇵 엔" },
                                            { code: "USD", label: "🇺🇸 달러" },
                                            { code: "EUR", label: "🇪🇺 유로" },
                                            { code: "CNY", label: "🇨🇳 위안" },
                                            { code: "THB", label: "🇹🇭 바트" },
                                            { code: "HKD", label: "🇭🇰 홍콩달러" },
                                            { code: "SGD", label: "🇸🇬 싱가포르" },
                                            { code: "GBP", label: "🇬🇧 파운드" },
                                            { code: "AUD", label: "🇦🇺 호주달러" },
                                        ].map((currency) => (
                                            <button
                                                key={currency.code}
                                                onClick={() => {
                                                    setTargetCurrency(currency.code)
                                                    setConvertedAmount(null)
                                                }}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition ${targetCurrency === currency.code
                                                    ? "bg-blue-500 text-white"
                                                    : "border border-[#ECEEF2] text-gray-600 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {currency.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 입력 */}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1 flex items-center border border-[#ECEEF2] rounded-xl px-3 py-2 gap-1">
                                            <span className="text-xs text-gray-400 flex-shrink-0">₩</span>
                                            <input
                                                value={krwAmount}
                                                onChange={(e) => {
                                                    setKrwAmount(e.target.value.replace(/[^0-9]/g, ""))
                                                    setConvertedAmount(null)
                                                }}
                                                onKeyDown={(e) => e.key === "Enter" && convertCurrency()}
                                                placeholder="원화 금액 입력"
                                                className="flex-1 text-sm outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={convertCurrency}
                                            disabled={exchangeLoading || !krwAmount}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            변환
                                        </button>
                                    </div>

                                    {/* 결과 */}
                                    {convertedAmount !== null && (
                                        <div className="mt-3 bg-blue-50 rounded-xl px-4 py-3 text-center">
                                            <div className="text-xs text-gray-500 mb-1">
                                                ₩{Number(krwAmount).toLocaleString()} =
                                            </div>
                                            <div className="text-xl font-bold text-blue-600">
                                                {convertedAmount.toLocaleString()} {targetCurrency}
                                            </div>
                                            {exchangeRates[targetCurrency] && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    1원 = {exchangeRates[targetCurrency].toFixed(4)} {targetCurrency}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 메모 탭 */}
                        {rightTab === "memo" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-700">DAY {selectedDay} 메모</div>
                                    {memoSaving
                                        ? <span className="text-xs text-blue-400 animate-pulse">저장 중...</span>
                                        : memos[selectedDay] !== undefined && <span className="text-xs text-gray-400">자동 저장</span>
                                    }
                                </div>
                                <textarea
                                    value={memos[selectedDay] ?? ""}
                                    onChange={(e) => handleMemoChange(selectedDay, e.target.value)}
                                    placeholder={`DAY ${selectedDay} 메모를 남겨보세요.\n예) 예약 정보, 준비물, 참고 사항 등`}
                                    className="w-full h-72 border border-[#ECEEF2] rounded-xl p-3 text-sm outline-none focus:border-blue-400 resize-none leading-relaxed"
                                />
                                <div className="text-xs text-gray-400">입력 후 1초 뒤 자동으로 저장됩니다.</div>
                                {Object.entries(memos).filter(([d, m]) => Number(d) !== selectedDay && m).length > 0 && (
                                    <div className="mt-2">
                                        <div className="text-xs text-gray-400 mb-2">다른 날 메모</div>
                                        <div className="space-y-1.5">
                                            {Object.entries(memos)
                                                .filter(([d, m]) => Number(d) !== selectedDay && m)
                                                .map(([d, m]) => (
                                                    <button key={d} onClick={() => setSelectedDay(Number(d))} className="w-full text-left border border-[#ECEEF2] rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                                                        <span className="font-semibold text-blue-500">DAY {d}</span>
                                                        <span className="ml-2 text-gray-400">{String(m).slice(0, 30)}{String(m).length > 30 ? "..." : ""}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}