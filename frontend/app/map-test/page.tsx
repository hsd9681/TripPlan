"use client"

import { useEffect, useState } from "react"
import axios from "axios"

import {
    GoogleMap,
    Polyline,
    useJsApiLoader
} from "@react-google-maps/api"

import { decode } from "@googlemaps/polyline-codec"



export default function MapPage() {

    const [distance, setDistance] = useState("")
    const [duration, setDuration] = useState("")
    const [travelMode, setTravelMode] = useState("")

    const [polyline, setPolyline] = useState("")
    const [path, setPath] = useState<any[]>([])
    const [map, setMap] = useState<google.maps.Map | null>(null)

    // 1. Google Maps JS API 로드 (중복 방지 핵심)
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
    })

    // 2. 백엔드에서 route 가져오기
    useEffect(() => {
        axios
            .get("http://127.0.0.1:8000/route-test")
            .then((res) => {

                setPolyline(res.data.polyline)
                setDistance(res.data.distance)
                setDuration(res.data.duration)
                setTravelMode("자동차")

                const decoded = decode(res.data.polyline)

                const formattedPath = decoded.map(([lat, lng]) => ({
                    lat,
                    lng
                }))

                setPath(formattedPath)
            })
            .catch((err) => {
                console.error(err)
            })
    }, [])

    // 3. 경로가 생기면 지도 자동 맞춤
    useEffect(() => {
        if (!map || path.length === 0) return

        const bounds = new google.maps.LatLngBounds()

        path.forEach((p) => bounds.extend(p))

        map.fitBounds(bounds)
    }, [map, path])

    // 4. 로딩 처리
    if (!isLoaded) {
        return <div>Loading Map...</div>
    }

    return (
        <div style={{ position: "relative" }}>

        <div
            style={{
                position: "absolute",
                top: 20,
                left: 20,
                zIndex: 999,
                background: "white",
                padding: "12px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
            }}
        >
            <div>
                <strong>이동수단:</strong> {travelMode}
            </div>

            <div>
                <strong>거리:</strong> {distance}
            </div>

            <div>
                <strong>예상시간:</strong> {duration}
            </div>
        </div>
        <GoogleMap
            onLoad={(mapInstance) => setMap(mapInstance)}
            mapContainerStyle={{
                width: "100%",
                height: "100vh"
            }}
            center={{
                lat: 35.6764,
                lng: 139.6500
            }}
            zoom={12}
        >
            {path.length > 0 && (
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#4285F4",
                        strokeWeight: 6
                    }}
                />
            )}
        </GoogleMap>
        </div>
    )
}