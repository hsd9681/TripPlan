"use client"

import { useEffect, useState } from "react"
import api from "../lib/api"
import { useParams } from "next/navigation"
import { GoogleMap, Polyline, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"
import { decode } from "@googlemaps/polyline-codec"
import { useSearchPanel } from "../context/SearchPanelContext"
import { useTrip } from "../context/TripContext"
import { toast } from "react-hot-toast"

// 날씨 아이콘 매핑
const getWeatherEmoji = (code: number) => {
    if (code === 0) return "☀️"
    if (code <= 2) return "⛅"
    if (code <= 49) return "🌫️"
    if (code <= 69) return "🌧️"
    if (code <= 79) return "❄️"
    if (code <= 99) return "⛈️"
    return "🌤️"
}

export default function SearchPanel() {
    const params = useParams()
    const tripId = Number(params.tripId)

    const { isOpen } = useSearchPanel()
    const {
        selectedDay,
        scheduleMode,
        schedule,
        setSchedule,
        editingIndex,
        setEditingIndex,
        refreshTrip
    } = useTrip()

    const [distance, setDistance] = useState("")
    const [duration, setDuration] = useState("")
    const [mapCenter, setMapCenter] = useState({ lat: 35.6764, lng: 139.6500 })
    const [path, setPath] = useState<any[]>([])
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [query, setQuery] = useState("")
    const [origin, setOrigin] = useState("")
    const [destination, setDestination] = useState("")
    const [places, setPlaces] = useState<any[]>([])
    const [markers, setMarkers] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState("전체")
    const [selectedPlace, setSelectedPlace] = useState<any>(null)

    // GPS 상태
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [userMarker, setUserMarker] = useState<any>(null)

    // 날씨 상태
    const [weather, setWeather] = useState<any>(null)
    const [weatherLoading, setWeatherLoading] = useState(false)

    const categories = ["전체", "맛집", "카페", "관광지", "쇼핑", "숙소"]

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
    })

    useEffect(() => {
        if (!map || path.length === 0) return
        const bounds = new google.maps.LatLngBounds()
        path.forEach((p) => bounds.extend(p))
        map.fitBounds(bounds)
    }, [map, path])

    // ── GPS 현재 위치 가져오기 ──
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("GPS를 지원하지 않는 브라우저예요.")
            return
        }

        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(position.coords)
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                setUserLocation(loc)
                setMapCenter(loc)
                setUserMarker(loc)

                if (map) {
                    map.panTo(loc)
                    map.setZoom(15)
                }

                // 날씨도 함께 가져오기
                fetchWeather(loc.lat, loc.lng)
                toast.success("현재 위치를 찾았어요!")
                setLocating(false)
            },
            (err) => {
                toast.error("위치 정보를 가져올 수 없어요. 브라우저 위치 권한을 확인해주세요.")
                setLocating(false)
            },
            { timeout: 10000, enableHighAccuracy: true }
        )
    }

    // ── 날씨 가져오기 (Open-Meteo API - 무료, 키 불필요) ──
    const fetchWeather = async (lat: number, lng: number) => {
        setWeatherLoading(true)
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`
            )
            const data = await res.json()
            const current = data.current

            // 역지오코딩으로 도시명 가져오기
            let cityName = "현재 위치"
            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`
                )
                const geoData = await geoRes.json()
                cityName =
                    geoData.address?.city ||
                    geoData.address?.town ||
                    geoData.address?.county ||
                    "현재 위치"
            } catch { }

            setWeather({
                temp: Math.round(current.temperature_2m),
                code: current.weathercode,
                wind: Math.round(current.windspeed_10m),
                humidity: current.relativehumidity_2m,
                city: cityName,
            })
        } catch {
            toast.error("날씨 정보를 가져오지 못했어요.")
        } finally {
            setWeatherLoading(false)
        }
    }

    // ── 장소 검색 ──
    const searchPlaces = async () => {
        if (!query.trim()) return
        try {
            const res = await api.get("places", { params: { query } })
            setPlaces(res.data.results)
            setMarkers(res.data.results)
            if (map && res.data.results.length > 0) {
                const first = res.data.results[0]
                const newCenter = {
                    lat: first.geometry.location.lat,
                    lng: first.geometry.location.lng
                }
                setMapCenter(newCenter)
                map.panTo(newCenter)
                map.setZoom(15)
            }
        } catch (err) {
            console.error(err)
        }
    }

    // ── 카테고리 검색 (현재 위치 or 지도 중심) ──
    const searchByCategory = async (category: string) => {
        if (!map) return
        setSelectedCategory(category)

        // 현재 위치가 있으면 현재 위치 기준, 없으면 지도 중심 기준
        const center = userLocation || map.getCenter()?.toJSON()
        if (!center) return

        try {
            const res = await api.get("nearby", {
                params: {
                    lat: center.lat,
                    lng: center.lng,
                    category
                }
            })
            setPlaces(res.data.results)
            setMarkers(res.data.results)
        } catch (err) {
            console.error(err)
        }
    }

    // ── 장소 상세 ──
    const openPlaceDetail = async (place: any) => {
        const res = await api.get("place-detail", {
            params: { place_id: place.place_id }
        })
        setSelectedPlace(res.data.result)
    }

    const getDefaultDuration = (types: string[]) => {
        if (types?.includes("restaurant")) return 90
        if (types?.includes("cafe")) return 60
        if (types?.includes("shopping_mall")) return 180
        if (types?.includes("lodging")) return 0
        return 120
    }

    const getCategory = (types: string[]) => {
        if (types?.includes("restaurant")) return "맛집"
        if (types?.includes("cafe")) return "카페"
        if (types?.includes("shopping_mall")) return "쇼핑"
        if (types?.includes("lodging")) return "숙소"
        return "관광지"
    }

    return (
        <div className={`transition-all duration-300 overflow-hidden bg-white border-l ${isOpen ? "w-[1200px]" : "w-0"}`}>
            {isOpen && (
                <div className="h-full flex flex-col bg-white">

                    {/* 검색창 + GPS + 날씨 */}
                    <div className="p-4 border-b bg-white space-y-3">

                        {/* 검색 입력 */}
                        <div className="flex gap-2">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                                placeholder="장소, 주소 검색"
                                className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                            />
                            <button
                                onClick={searchPlaces}
                                className="bg-blue-500 text-white px-5 rounded-xl text-sm font-semibold"
                            >
                                검색
                            </button>

                            {/* GPS 버튼 */}
                            <div className="flex gap-2">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                                    placeholder="장소, 주소 검색"
                                    className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                                />
                                <button
                                    onClick={searchPlaces}
                                    className="bg-blue-500 text-white px-5 rounded-xl text-sm font-semibold"
                                >
                                    검색
                                </button>
                            </div>
                        </div>

                        {/* 날씨 카드 */}
                        {weather && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getWeatherEmoji(weather.code)}</span>
                                    <div>
                                        <div className="font-semibold text-sm text-gray-800">{weather.city}</div>
                                        <div className="text-xs text-gray-500">현재 날씨</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{weather.temp}°C</div>
                                    <div className="text-xs text-gray-500">
                                        💨 {weather.wind}km/h · 💧 {weather.humidity}%
                                    </div>
                                </div>
                            </div>
                        )}

                        {weatherLoading && (
                            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-blue-500">
                                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
                                날씨 정보 불러오는 중...
                            </div>
                        )}

                    </div>

                    {/* 본문 */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* 검색 결과 목록 */}
                        <div className="w-[380px] border-r overflow-y-auto bg-white">
                            {places.length === 0 && (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    <div className="text-3xl mb-2">🔍</div>
                                    장소를 검색하거나<br />
                                    카테고리를 선택해보세요
                                    {userLocation && (
                                        <div className="mt-2 text-blue-400 text-xs">
                                            📍 현재 위치 기준으로 검색됩니다
                                        </div>
                                    )}
                                </div>
                            )}

                            {places.map((place: any) => (
                                <div
                                    key={place.place_id}
                                    onClick={() => openPlaceDetail(place)}
                                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                                >
                                    {place.photos?.[0] && (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/place-photo?photo_reference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`}
                                            alt={place.name}
                                            className="w-full h-40 object-cover rounded-xl mb-3"
                                        />
                                    )}
                                    <div className="font-semibold text-base">{place.name}</div>
                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                        <span className="text-yellow-500">⭐ {place.rating ?? "-"}</span>
                                        {place.user_ratings_total && (
                                            <span className="text-gray-400">({place.user_ratings_total})</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {place.formatted_address || place.vicinity}
                                    </div>
                                    <button className="mt-3 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
                                        상세정보
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* 지도 영역 */}
                        <div className="flex-1 relative">

                            {/* 카테고리 버튼 */}
                            {!selectedPlace && (
                                <div className="absolute top-16 left-4 z-20 flex gap-2 flex-wrap">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => searchByCategory(category)}
                                            className={`px-4 py-2 rounded-full shadow-md text-sm font-medium border transition ${selectedCategory === category
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                    {userLocation && (
                                        <span className="px-3 py-2 rounded-full bg-blue-500 text-white text-xs font-medium shadow-md">
                                            📍 내 위치 기준
                                        </span>
                                    )}
                                </div>
                            )}

                            {isLoaded && (
                                <GoogleMap
                                    onLoad={(mapInstance) => setMap(mapInstance)}
                                    mapContainerStyle={{ width: "100%", height: "100%" }}
                                    center={mapCenter}
                                    zoom={12}
                                >
                                    {/* 경로 */}
                                    {path.length > 0 && (
                                        <Polyline
                                            path={path}
                                            options={{ strokeColor: "#4285F4", strokeWeight: 6 }}
                                        />
                                    )}

                                    {/* 장소 마커 */}
                                    {markers.map((place: any) => (
                                        <Marker
                                            key={place.place_id}
                                            position={{
                                                lat: place.geometry.location.lat,
                                                lng: place.geometry.location.lng
                                            }}
                                            onClick={() => openPlaceDetail(place)}
                                        />
                                    ))}

                                    {/* 현재 위치 마커 */}
                                    {userMarker && (
                                        <Marker
                                            position={userMarker}
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
                                </GoogleMap>
                            )}

                            {/* 지도 위 GPS 버튼 */}
                            <div className="absolute bottom-6 right-16 z-20 flex flex-col gap-2">
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
                            </div>

                            {/* 장소 상세 패널 */}
                            {selectedPlace && (
                                <div className="absolute top-4 left-4 w-[420px] h-[90%] bg-white rounded-2xl shadow-2xl z-30 overflow-y-auto">
                                    <div className="flex justify-end p-4 sticky top-0 bg-white z-10">
                                        <button
                                            onClick={() => setSelectedPlace(null)}
                                            className="text-2xl font-bold text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {selectedPlace.photos?.[0] && (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/place-photo?photo_reference=${selectedPlace.photos[0].photo_reference}`}
                                            alt={selectedPlace.name}
                                            className="w-full h-64 object-cover"
                                        />
                                    )}

                                    <div className="p-5">
                                        <h2 className="text-2xl font-bold">{selectedPlace.name}</h2>

                                        <div className="mt-2 text-lg">
                                            ⭐ {selectedPlace.rating ?? "-"}
                                            <span className="text-gray-400 text-sm ml-2">
                                                ({selectedPlace.user_ratings_total}개 리뷰)
                                            </span>
                                        </div>

                                        {selectedPlace.price_level && (
                                            <div className="mt-2 text-gray-700">
                                                가격대: {
                                                    selectedPlace.price_level === 1 ? "💰 저렴" :
                                                        selectedPlace.price_level === 2 ? "💰💰 보통" :
                                                            selectedPlace.price_level === 3 ? "💰💰💰 비쌈" :
                                                                selectedPlace.price_level === 4 ? "💰💰💰💰 매우 비쌈" : ""
                                                }
                                            </div>
                                        )}

                                        {selectedPlace.current_opening_hours && (
                                            <div className="mt-2 font-medium">
                                                {selectedPlace.current_opening_hours?.open_now ? "🟢 영업중" : "🔴 영업종료"}
                                            </div>
                                        )}

                                        {selectedPlace.editorial_summary?.overview && (
                                            <div className="mt-4 text-gray-700 text-sm leading-relaxed">
                                                {selectedPlace.editorial_summary.overview}
                                            </div>
                                        )}

                                        <div className="mt-5">
                                            <div className="font-semibold text-sm">주소</div>
                                            <div className="text-gray-600 text-sm mt-1">
                                                {selectedPlace.formatted_address || selectedPlace.vicinity}
                                            </div>
                                        </div>

                                        {selectedPlace.formatted_phone_number && (
                                            <div className="mt-4">
                                                <div className="font-semibold text-sm">전화번호</div>
                                                <div className="text-gray-600 text-sm mt-1">
                                                    {selectedPlace.formatted_phone_number}
                                                </div>
                                            </div>
                                        )}

                                        {selectedPlace.website && (
                                            <div className="mt-4">
                                                <div className="font-semibold text-sm">웹사이트</div>
                                                <a
                                                    href={selectedPlace.website}
                                                    target="_blank"
                                                    className="text-blue-500 text-sm break-all"
                                                >
                                                    {selectedPlace.website}
                                                </a>
                                            </div>
                                        )}

                                        {selectedPlace.opening_hours?.weekday_text && (
                                            <div className="mt-4">
                                                <div className="font-semibold text-sm mb-2">영업시간</div>
                                                {selectedPlace.opening_hours.weekday_text.map((day: string) => (
                                                    <div key={day} className="text-xs text-gray-600">{day}</div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedPlace.reviews?.length > 0 && (
                                            <div className="mt-6">
                                                <div className="font-semibold text-sm mb-3">리뷰</div>
                                                {selectedPlace.reviews.map((review: any) => (
                                                    <div key={review.time} className="border-t pt-3 mt-3">
                                                        <div className="font-medium text-sm">{review.author_name}</div>
                                                        <div className="text-sm">⭐ {review.rating}</div>
                                                        <div className="text-xs text-gray-600 mt-1">{review.text}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 일정 추가/수정 버튼 */}
                                        <div className="mt-8 flex gap-3">
                                            <button
                                                onClick={async () => {
                                                    if (selectedDay === null) {
                                                        toast.error("DAY를 먼저 선택해주세요.")
                                                        return
                                                    }
                                                    const newPlace = {
                                                        trip_id: tripId,
                                                        day_number: selectedDay,
                                                        order_no: (schedule[selectedDay]?.length || 0) + 1,
                                                        place_id: selectedPlace.place_id,
                                                        name: selectedPlace.name,
                                                        category: getCategory(selectedPlace.types),
                                                        photo: selectedPlace.photos?.[0]?.photo_reference,
                                                        rating: selectedPlace.rating,
                                                        address: selectedPlace.formatted_address,
                                                        duration: getDefaultDuration(selectedPlace.types),
                                                        lat: selectedPlace.geometry.location.lat,
                                                        lng: selectedPlace.geometry.location.lng
                                                    }
                                                    const updatedSchedule = { ...schedule }
                                                    updatedSchedule[selectedDay] ??= []

                                                    if (editingIndex !== null) {
                                                        await api.put(
                                                            `schedule/${updatedSchedule[selectedDay][editingIndex].id}`,
                                                            newPlace
                                                        )
                                                        updatedSchedule[selectedDay][editingIndex] = {
                                                            ...updatedSchedule[selectedDay][editingIndex],
                                                            ...newPlace
                                                        }
                                                        setSchedule(updatedSchedule)
                                                        await refreshTrip()
                                                        setEditingIndex(null)
                                                        setSelectedPlace(null)
                                                        toast.success("일정이 수정되었습니다.")
                                                    } else {
                                                        const res = await api.post("schedule", newPlace)
                                                        setSchedule({
                                                            ...schedule,
                                                            [selectedDay]: [
                                                                ...(schedule[selectedDay] || []),
                                                                res.data
                                                            ]
                                                        })
                                                        await refreshTrip()
                                                        setSelectedPlace(null)
                                                        toast.success(`DAY ${selectedDay}에 추가되었습니다.`)
                                                    }
                                                }}
                                                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600"
                                            >
                                                {editingIndex !== null ? "일정 수정" : "일정 추가"}
                                            </button>
                                            <button className="flex-1 border py-3 rounded-xl text-gray-600 hover:bg-gray-50">
                                                길찾기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    )
}