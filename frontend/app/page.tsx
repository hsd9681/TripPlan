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
    )
}