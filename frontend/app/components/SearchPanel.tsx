"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import api from "../lib/api"
import { useParams } from "next/navigation"
import {
    GoogleMap,
    Polyline,
    Marker,
    DirectionsRenderer,
    useJsApiLoader
} from "@react-google-maps/api"
import { GOOGLE_MAPS_LIBRARIES } from "../lib/googleMaps"
import { useSearchPanel } from "../context/SearchPanelContext"
import { useTrip } from "../context/TripContext"
import { toast } from "react-hot-toast"

const getWeatherEmoji = (code: number) => {
    if (code === 0) return "☀️"
    if (code <= 2) return "⛅"
    if (code <= 49) return "🌫️"
    if (code <= 69) return "🌧️"
    if (code <= 79) return "❄️"
    if (code <= 99) return "⛈️"
    return "🌤️"
}

const LIBRARIES: ("places")[] = ["places"]

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

    // 지도
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
    const [mapZoom, setMapZoom] = useState(13)

    // 검색
    const [query, setQuery] = useState("")
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)

    // 장소
    const [places, setPlaces] = useState<any[]>([])
    const [markers, setMarkers] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState("전체")
    const [categoryLoading, setCategoryLoading] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<any>(null)
    const [photoIndex, setPhotoIndex] = useState(0)

    // GPS
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [userMarker, setUserMarker] = useState<{ lat: number; lng: number } | null>(null)

    // 날씨
    const [weather, setWeather] = useState<any>(null)
    const [weatherLoading, setWeatherLoading] = useState(false)

    // 길찾기
    const [routeMode, setRouteMode] = useState(false)
    const [routeOrigin, setRouteOrigin] = useState("")
    const [routeDestination, setRouteDestination] = useState("")
    const [routeDirections, setRouteDirections] = useState<google.maps.DirectionsResult | null>(null)
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; mode: string } | null>(null)
    const [routeLoading, setRouteLoading] = useState(false)
    const [routeTravelMode, setRouteTravelMode] = useState<"TRANSIT" | "WALKING" | "DRIVING">("TRANSIT")

    const categories = ["전체", "맛집", "카페", "관광지", "쇼핑", "숙소"]

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: GOOGLE_MAPS_LIBRARIES,
    })

    // ── 패널 열릴 때 초기 위치 ──
    useEffect(() => {
        if (!isOpen || mapCenter) return
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                    setMapCenter(loc)
                    setUserLocation(loc)
                    setUserMarker(loc)
                },
                () => setMapCenter({ lat: 37.5665, lng: 126.9780 }),
                { timeout: 5000 }
            )
        } else {
            setMapCenter({ lat: 37.5665, lng: 126.9780 })
        }
    }, [isOpen])

    // ── AutocompleteService 초기화 ──
    useEffect(() => {
        if (isLoaded && !autocompleteService.current) {
            autocompleteService.current = new google.maps.places.AutocompleteService()
        }
    }, [isLoaded])

    // ── 검색어 자동완성 ──
    const handleQueryChange = (value: string) => {
        setQuery(value)
        if (!value.trim() || !autocompleteService.current) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }
        autocompleteService.current.getPlacePredictions(
            { input: value, language: "ko" },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions)
                    setShowSuggestions(true)
                } else {
                    setSuggestions([])
                    setShowSuggestions(false)
                }
            }
        )
    }

    // ── 자동완성 선택 ──
    const selectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
        setQuery(suggestion.description)
        setShowSuggestions(false)
        searchPlacesByQuery(suggestion.description)
    }

    // ── GPS ──
    const getCurrentLocation = () => {
        if (!navigator.geolocation) { toast.error("GPS를 지원하지 않는 브라우저예요."); return }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setUserLocation(loc)
                setMapCenter(loc)
                setUserMarker(loc)
                if (map) { map.panTo(loc); map.setZoom(15) }
                fetchWeather(loc.lat, loc.lng)
                toast.success("현재 위치를 찾았어요!")
                setLocating(false)
            },
            () => { toast.error("위치 정보를 가져올 수 없어요."); setLocating(false) },
            { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
        )
    }

    // ── 날씨 ──
    const fetchWeather = async (lat: number, lng: number) => {
        setWeatherLoading(true)
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`
            )
            const data = await res.json()
            const current = data.current
            let cityName = "현재 위치"
            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko&zoom=14`
                )
                const geoData = await geoRes.json()
                const addr = geoData.address || {}
                cityName = addr.suburb || addr.city_district || addr.city || addr.town || addr.county || "현재 위치"
            } catch { }
            setWeather({
                temp: Math.round(current.temperature_2m),
                code: current.weathercode,
                wind: Math.round(current.windspeed_10m),
                humidity: current.relativehumidity_2m,
                city: cityName,
            })
        } catch { toast.error("날씨 정보를 가져오지 못했어요.") }
        finally { setWeatherLoading(false) }
    }

    // ── 장소 검색 ──
    const searchPlacesByQuery = async (q: string) => {
        if (!q.trim()) return
        try {
            const res = await api.get("places", { params: { query: q } })
            const results = res.data.results || []
            setPlaces(results)
            setMarkers(results)
            if (map && results.length > 0) {
                const first = results[0]
                const newCenter = { lat: first.geometry.location.lat, lng: first.geometry.location.lng }
                setMapCenter(newCenter)
                map.panTo(newCenter)
                map.setZoom(15)
            }
        } catch { toast.error("검색에 실패했습니다.") }
    }

    const searchPlaces = () => {
        setShowSuggestions(false)
        searchPlacesByQuery(query)
    }

    // ── 카테고리 검색 (지도 중심 + 줌 레벨 기반) ──
    const searchByCategory = useCallback(async (category: string) => {
        if (!map) return
        setSelectedCategory(category)
        if (category === "전체") { setPlaces([]); setMarkers([]); return }
        setCategoryLoading(true)

        const center = map.getCenter()?.toJSON()
        if (!center) { setCategoryLoading(false); return }

        const zoom = map.getZoom() ?? 13
        const radius = Math.min(Math.max(Math.round(20000 / Math.pow(2, zoom - 10)), 300), 50000)

        try {
            const res = await api.get("nearby", {
                params: { lat: center.lat, lng: center.lng, category, radius }
            })
            const results = res.data.results || []
            setPlaces(results)
            setMarkers(results)
        } catch { toast.error("검색에 실패했습니다.") }
        finally { setCategoryLoading(false) }
    }, [map])

    // ── 장소 상세 ──
    const openPlaceDetail = async (place: any) => {
        setPhotoIndex(0)
        const res = await api.get("place-detail", { params: { place_id: place.place_id } })
        setSelectedPlace(res.data.result)
        // 지도를 해당 장소로 이동
        if (map && res.data.result?.geometry?.location) {
            const loc = res.data.result.geometry.location
            map.panTo({ lat: loc.lat, lng: loc.lng })
            map.setZoom(17)
            setMapCenter({ lat: loc.lat, lng: loc.lng })
        }
    }

    // ── 지도 마커 클릭 ──
    const handleMarkerClick = (place: any) => {
        openPlaceDetail(place)
    }

    // ── 길찾기 ──
    const searchRoute = (mode: "TRANSIT" | "WALKING" | "DRIVING" = routeTravelMode) => {
        if (!routeOrigin.trim() || !routeDestination.trim()) {
            toast.error("출발지와 도착지를 입력해주세요.")
            return
        }
        setRouteLoading(true)
        setRouteDirections(null)
        setRouteInfo(null)

        const travelModeMap = {
            TRANSIT: google.maps.TravelMode.TRANSIT,
            WALKING: google.maps.TravelMode.WALKING,
            DRIVING: google.maps.TravelMode.DRIVING,
        }

        const directionsService = new google.maps.DirectionsService()
        directionsService.route(
            { origin: routeOrigin, destination: routeDestination, travelMode: travelModeMap[mode] },
            (result, status) => {
                setRouteLoading(false)
                if (status === "OK" && result) {
                    setRouteDirections(result)
                    const leg = result.routes[0].legs[0]
                    const modeLabel = mode === "TRANSIT" ? "대중교통" : mode === "WALKING" ? "도보" : "자동차"
                    setRouteInfo({ distance: leg.distance?.text || "", duration: leg.duration?.text || "", mode: modeLabel })
                } else {
                    toast.error("경로를 찾을 수 없어요. 주소를 더 구체적으로 입력해보세요.")
                }
            }
        )
    }

    const clearRoute = () => {
        setRouteDirections(null)
        setRouteInfo(null)
        setRouteOrigin("")
        setRouteDestination("")
    }

    // ── 현재 위치를 출발지로 ──
    const setCurrentAsOrigin = () => {
        if (userLocation) {
            setRouteOrigin(`${userLocation.lat},${userLocation.lng}`)
            toast.success("현재 위치를 출발지로 설정했어요.")
        } else {
            getCurrentLocation()
        }
    }

    const getDefaultDuration = (types: string[]) => {
        if (types?.includes("restaurant")) return 90
        if (types?.includes("cafe")) return 60
        if (types?.includes("shopping_mall")) return 180
        return 120
    }

    const getCategory = (types: string[]) => {
        if (types?.includes("restaurant")) return "맛집"
        if (types?.includes("cafe")) return "카페"
        if (types?.includes("shopping_mall")) return "쇼핑"
        if (types?.includes("lodging")) return "숙소"
        return "관광지"
    }

    const isScheduleMode = scheduleMode || editingIndex !== null

    const photoUrl = (ref: string) =>
        `${process.env.NEXT_PUBLIC_API_URL}/place-photo?photo_reference=${ref}`

    return (
        <div className={`transition-all duration-300 overflow-hidden bg-white border-l ${isOpen ? "w-[1200px]" : "w-0"}`}>
            {isOpen && (
                <div className="h-full flex flex-col bg-white">

                    {/* 상단 검색 영역 */}
                    <div className="p-4 border-b bg-white space-y-3">

                        {/* 탭 */}
                        <div className="flex gap-2 border-b border-[#ECEEF2] pb-3">
                            <button
                                onClick={() => { setRouteMode(false); clearRoute() }}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!routeMode ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                            >
                                🔍 장소 검색
                            </button>
                            <button
                                onClick={() => setRouteMode(true)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${routeMode ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                            >
                                🗺️ 길찾기
                            </button>
                        </div>

                        {/* 장소 검색 */}
                        {!routeMode && (
                            <div className="relative">
                                <div className="flex gap-2">
                                    <input
                                        value={query}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        placeholder="장소, 주소 검색"
                                        className="flex-1 border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                    />
                                    <button onClick={searchPlaces} className="bg-blue-500 text-white px-5 rounded-xl text-sm font-semibold">
                                        검색
                                    </button>
                                </div>

                                {/* 자동완성 드롭다운 */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-[#ECEEF2] rounded-xl shadow-lg z-50 overflow-hidden">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.place_id}
                                                onClick={() => selectSuggestion(s)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-[#F1F2F5] last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-800">{s.structured_formatting.main_text}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{s.structured_formatting.secondary_text}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 길찾기 */}
                        {routeMode && (
                            <div className="space-y-2">
                                {/* 이동 수단 선택 */}
                                <div className="flex gap-2">
                                    {(["TRANSIT", "WALKING", "DRIVING"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => { setRouteTravelMode(mode); if (routeOrigin && routeDestination) searchRoute(mode) }}
                                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${routeTravelMode === mode ? "bg-blue-500 text-white border-blue-500" : "border-[#ECEEF2] text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {mode === "TRANSIT" ? "🚌 대중교통" : mode === "WALKING" ? "🚶 도보" : "🚗 자동차"}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        value={routeOrigin}
                                        onChange={(e) => setRouteOrigin(e.target.value)}
                                        placeholder="출발지"
                                        className="flex-1 border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                    />
                                    <button
                                        onClick={setCurrentAsOrigin}
                                        title="현재 위치를 출발지로"
                                        className="w-10 h-10 rounded-xl border border-[#ECEEF2] flex items-center justify-center text-blue-500 hover:bg-blue-50 flex-shrink-0"
                                    >
                                        📍
                                    </button>
                                </div>

                                {/* 출발/도착 스왑 버튼 */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-[#ECEEF2]" />
                                    <button
                                        onClick={() => { const tmp = routeOrigin; setRouteOrigin(routeDestination); setRouteDestination(tmp) }}
                                        className="w-8 h-8 rounded-full border border-[#ECEEF2] flex items-center justify-center text-gray-400 hover:bg-gray-50 text-lg"
                                        title="출발/도착 바꾸기"
                                    >
                                        ⇅
                                    </button>
                                    <div className="flex-1 h-px bg-[#ECEEF2]" />
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        value={routeDestination}
                                        onChange={(e) => setRouteDestination(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && searchRoute()}
                                        placeholder="도착지"
                                        className="flex-1 border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                    />
                                    <button
                                        onClick={() => searchRoute()}
                                        disabled={routeLoading}
                                        className="px-4 h-10 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex-shrink-0"
                                    >
                                        {routeLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" /> : "검색"}
                                    </button>
                                </div>

                                {/* 경로 결과 */}
                                {routeInfo && (
                                    <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                        <div className="text-sm text-blue-700 space-x-3">
                                            <span className="font-semibold">{routeInfo.mode}</span>
                                            <span>📏 {routeInfo.distance}</span>
                                            <span>⏱ {routeInfo.duration}</span>
                                        </div>
                                        <button onClick={clearRoute} className="text-xs text-gray-400 hover:text-gray-600">초기화</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 날씨 */}
                        {weather && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getWeatherEmoji(weather.code)}</span>
                                    <div>
                                        <div className="font-semibold text-sm">{weather.city}</div>
                                        <div className="text-xs text-gray-500">현재 날씨</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{weather.temp}°C</div>
                                    <div className="text-xs text-gray-500">💨 {weather.wind}km/h · 💧 {weather.humidity}%</div>
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
                        {!routeMode && (
                            <div className="w-[380px] border-r overflow-y-auto bg-white">
                                {places.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        <div className="text-3xl mb-2">🔍</div>
                                        장소를 검색하거나<br />카테고리를 선택해보세요
                                        {userLocation && <div className="mt-2 text-blue-400 text-xs">📍 현재 위치 기준</div>}
                                    </div>
                                ) : (
                                    places.map((place: any) => (
                                        <div
                                            key={place.place_id}
                                            onClick={() => openPlaceDetail(place)}
                                            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                                        >
                                            {place.photos?.[0] && (
                                                <img
                                                    src={photoUrl(place.photos[0].photo_reference)}
                                                    alt={place.name}
                                                    className="w-full h-36 object-cover rounded-xl mb-3"
                                                />
                                            )}
                                            <div className="font-semibold">{place.name}</div>
                                            <div className="flex items-center gap-2 mt-1 text-sm">
                                                <span className="text-yellow-500">⭐ {place.rating ?? "-"}</span>
                                                {place.user_ratings_total && <span className="text-gray-400">({place.user_ratings_total})</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">{place.formatted_address || place.vicinity}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 지도 */}
                        <div className="flex-1 relative">

                            {/* 카테고리 버튼 */}
                            {!routeMode && !selectedPlace && (
                                <div className="absolute top-12 left-4 z-20 flex gap-2 flex-wrap">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => searchByCategory(category)}
                                            className={`px-3 py-1.5 rounded-full shadow-md text-xs font-medium border transition flex items-center gap-1 ${selectedCategory === category ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                                        >
                                            {categoryLoading && selectedCategory === category && (
                                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 이 지역 재검색 */}
                            {!routeMode && selectedCategory !== "전체" && (
                                <button
                                    onClick={() => searchByCategory(selectedCategory)}
                                    className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-white border border-[#ECEEF2] rounded-full px-4 py-1.5 text-xs font-medium text-gray-700 shadow-md hover:bg-gray-50 flex items-center gap-1"
                                >
                                    🔄 이 지역 재검색
                                </button>
                            )}

                            {isLoaded && mapCenter && (
                                <GoogleMap
                                    onLoad={(m) => setMap(m)}
                                    mapContainerStyle={{ width: "100%", height: "100%" }}
                                    center={mapCenter}
                                    zoom={13}
                                    onZoomChanged={() => { if (map) setMapZoom(map.getZoom() ?? 13) }}
                                    onDragEnd={() => {
                                        if (selectedCategory !== "전체" && map) {
                                            searchByCategory(selectedCategory)
                                        }
                                    }}
                                >
                                    {/* 길찾기 경로 */}
                                    {routeDirections && (
                                        <DirectionsRenderer
                                            directions={routeDirections}
                                            options={{
                                                polylineOptions: { strokeColor: "#3B82F6", strokeWeight: 5 }
                                            }}
                                        />
                                    )}

                                    {/* 장소 마커 */}
                                    {!routeDirections && markers.map((place: any) => (
                                        <Marker
                                            key={place.place_id}
                                            position={{ lat: place.geometry.location.lat, lng: place.geometry.location.lng }}
                                            onClick={() => handleMarkerClick(place)}
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

                            {/* GPS 버튼 */}
                            <div className="absolute bottom-5 right-4 z-20">
                                <button
                                    onClick={getCurrentLocation}
                                    disabled={locating}
                                    className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-lg transition ${locating ? "bg-white text-gray-400" : userLocation ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                >
                                    {locating ? <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /> : "📍"}
                                </button>
                            </div>

                            {/* 장소 상세 패널 */}
                            {selectedPlace && (
                                <div className="absolute top-0 left-0 w-[420px] h-full bg-white shadow-2xl z-30 overflow-y-auto flex flex-col">

                                    {/* 사진 슬라이더 */}
                                    {selectedPlace.photos?.length > 0 ? (
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={photoUrl(selectedPlace.photos[photoIndex].photo_reference)}
                                                alt={selectedPlace.name}
                                                className="w-full h-64 object-cover"
                                            />
                                            {/* 닫기 버튼 */}
                                            <button
                                                onClick={() => setSelectedPlace(null)}
                                                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                            >
                                                ‹
                                            </button>
                                            {/* 사진 개수 표시 */}
                                            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                                {photoIndex + 1} / {selectedPlace.photos.length}
                                            </div>
                                            {/* 이전/다음 버튼 */}
                                            {photoIndex > 0 && (
                                                <button
                                                    onClick={() => setPhotoIndex(i => i - 1)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                                                >
                                                    ‹
                                                </button>
                                            )}
                                            {photoIndex < selectedPlace.photos.length - 1 && (
                                                <button
                                                    onClick={() => setPhotoIndex(i => i + 1)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                                                >
                                                    ›
                                                </button>
                                            )}
                                            {/* 사진 썸네일 */}
                                            <div className="absolute bottom-3 left-3 flex gap-1">
                                                {selectedPlace.photos.slice(0, 5).map((_: any, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setPhotoIndex(i)}
                                                        className={`w-2 h-2 rounded-full transition ${i === photoIndex ? "bg-white" : "bg-white/50"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative flex-shrink-0 h-16 bg-gray-100 flex items-center justify-center">
                                            <button
                                                onClick={() => setSelectedPlace(null)}
                                                className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 font-bold"
                                            >
                                                ← 뒤로
                                            </button>
                                        </div>
                                    )}

                                    <div className="p-5 flex-1">
                                        {/* 장소명 */}
                                        <h2 className="text-xl font-bold">{selectedPlace.name}</h2>
                                        <div className="text-sm text-gray-500 mt-0.5">
                                            {selectedPlace.types?.[0]?.replace(/_/g, " ")}
                                        </div>

                                        {/* 평점 */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-yellow-500 font-bold">⭐ {selectedPlace.rating ?? "-"}</span>
                                            {selectedPlace.user_ratings_total && (
                                                <span className="text-gray-400 text-sm">리뷰 {selectedPlace.user_ratings_total}개</span>
                                            )}
                                            {selectedPlace.price_level && (
                                                <span className="text-gray-500 text-sm">
                                                    {"💰".repeat(selectedPlace.price_level)}
                                                </span>
                                            )}
                                        </div>

                                        {/* 영업 상태 */}
                                        {selectedPlace.current_opening_hours && (
                                            <div className={`mt-2 text-sm font-medium ${selectedPlace.current_opening_hours.open_now ? "text-green-600" : "text-red-500"}`}>
                                                {selectedPlace.current_opening_hours.open_now ? "🟢 영업중" : "🔴 영업종료"}
                                            </div>
                                        )}

                                        {/* 출발 / 도착 / 공유 버튼 */}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    setRouteOrigin(selectedPlace.name)
                                                    setSelectedPlace(null)
                                                    setRouteMode(true)
                                                }}
                                                className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600"
                                            >
                                                출발
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRouteDestination(selectedPlace.name)
                                                    setSelectedPlace(null)
                                                    setRouteMode(true)
                                                }}
                                                className="flex-1 bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-200"
                                            >
                                                도착
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        `${selectedPlace.name} - ${selectedPlace.formatted_address}`
                                                    )
                                                    toast.success("주소가 복사되었습니다.")
                                                }}
                                                className="w-10 border border-[#ECEEF2] rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                                title="주소 복사"
                                            >
                                                📋
                                            </button>
                                        </div>

                                        {/* 구분선 */}
                                        <div className="border-t border-[#ECEEF2] mt-4 mb-4" />

                                        {/* 주소 */}
                                        <div className="flex items-start gap-2 text-sm">
                                            <span className="text-gray-400 flex-shrink-0 mt-0.5">📍</span>
                                            <span className="text-gray-700">{selectedPlace.formatted_address || selectedPlace.vicinity}</span>
                                        </div>

                                        {/* 전화번호 */}
                                        {selectedPlace.formatted_phone_number && (
                                            <div className="flex items-center gap-2 text-sm mt-3">
                                                <span className="text-gray-400">📞</span>
                                                <a href={`tel:${selectedPlace.formatted_phone_number}`} className="text-blue-500">
                                                    {selectedPlace.formatted_phone_number}
                                                </a>
                                            </div>
                                        )}

                                        {/* 웹사이트 */}
                                        {selectedPlace.website && (
                                            <div className="flex items-center gap-2 text-sm mt-3">
                                                <span className="text-gray-400">🌐</span>
                                                <a href={selectedPlace.website} target="_blank" className="text-blue-500 truncate">
                                                    {selectedPlace.website}
                                                </a>
                                            </div>
                                        )}

                                        {/* 영업시간 */}
                                        {selectedPlace.opening_hours?.weekday_text && (
                                            <div className="mt-4">
                                                <div className="font-semibold text-sm mb-2">영업시간</div>
                                                {selectedPlace.opening_hours.weekday_text.map((day: string) => (
                                                    <div key={day} className="text-xs text-gray-600 py-0.5">{day}</div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 소개 */}
                                        {selectedPlace.editorial_summary?.overview && (
                                            <div className="mt-4 text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-xl p-3">
                                                {selectedPlace.editorial_summary.overview}
                                            </div>
                                        )}

                                        {/* 리뷰 */}
                                        {selectedPlace.reviews?.length > 0 && (
                                            <div className="mt-5">
                                                <div className="font-semibold text-sm mb-3">리뷰</div>
                                                {selectedPlace.reviews.slice(0, 3).map((review: any) => (
                                                    <div key={review.time} className="border border-[#ECEEF2] rounded-xl p-3 mb-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {review.profile_photo_url && (
                                                                <img src={review.profile_photo_url} className="w-6 h-6 rounded-full" alt="" />
                                                            )}
                                                            <span className="font-medium text-xs">{review.author_name}</span>
                                                            <span className="text-yellow-500 text-xs ml-auto">{"⭐".repeat(review.rating)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">{review.text}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 일정 추가 버튼 (일정 추가 모드일 때만) */}
                                        {isScheduleMode && (
                                            <button
                                                onClick={async () => {
                                                    if (selectedDay === null) { toast.error("DAY를 먼저 선택해주세요."); return }
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
                                                        await api.put(`schedule/${updatedSchedule[selectedDay][editingIndex].id}`, newPlace)
                                                        updatedSchedule[selectedDay][editingIndex] = { ...updatedSchedule[selectedDay][editingIndex], ...newPlace }
                                                        setSchedule(updatedSchedule)
                                                        await refreshTrip()
                                                        setEditingIndex(null)
                                                        setSelectedPlace(null)
                                                        toast.success("일정이 수정되었습니다.")
                                                    } else {
                                                        const res = await api.post("schedule", newPlace)
                                                        setSchedule({ ...schedule, [selectedDay]: [...(schedule[selectedDay] || []), res.data] })
                                                        await refreshTrip()
                                                        setSelectedPlace(null)
                                                        toast.success(`DAY ${selectedDay}에 추가되었습니다.`)
                                                    }
                                                }}
                                                className="w-full mt-5 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600"
                                            >
                                                {editingIndex !== null ? "✏️ 일정 수정" : "➕ 일정 추가"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}