"use client"

import { useEffect, useState } from "react"
import axios from "axios"

import { GoogleMap, Polyline, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"

import { decode } from "@googlemaps/polyline-codec"

import {
    useSearchPanel
} from "../context/SearchPanelContext"

export default function SearchPanel() {

    const {
        isOpen
    } = useSearchPanel()

    const [distance, setDistance] = useState("")
    const [duration, setDuration] = useState("")
    const [travelMode, setTravelMode] = useState("")
    const [mapCenter, setMapCenter] =
        useState({
            lat: 35.6764,
            lng: 139.6500
        })

    const [path, setPath] = useState<any[]>([])
    const [map, setMap] =
        useState<google.maps.Map | null>(null)

    const [query, setQuery] = useState("")
    const [origin, setOrigin] = useState("")
    const [destination, setDestination] = useState("")
    const [places, setPlaces] =
        useState<any[]>([])
    const [markers, setMarkers] =
        useState<any[]>([])

    const [
        selectedCategory,
        setSelectedCategory
    ] = useState("전체")

    const categories = [
        "전체",
        "맛집",
        "카페",
        "관광지",
        "쇼핑",
        "숙소"
    ]
    const [
        selectedPlace,
        setSelectedPlace
    ] = useState<any>(
        null
    )

    const { isLoaded } =
        useJsApiLoader({
            googleMapsApiKey:
                process.env
                    .NEXT_PUBLIC_GOOGLE_MAP_KEY!
        })

    useEffect(() => {

        if (!map) return

        if (path.length === 0) return

        const bounds =
            new google.maps.LatLngBounds()

        path.forEach((p) =>
            bounds.extend(p)
        )

        map.fitBounds(bounds)

    }, [map, path])

    const searchPlaces = async () => {


        if (!query.trim()) return

        try {

            const res =
                await axios.get(
                    "http://127.0.0.1:8000/places",
                    {
                        params: {
                            query
                        }
                    }
                )

            setPlaces(
                res.data.results
            )

            setMarkers(
                res.data.results
            )
            if (
                map &&
                res.data.results.length > 0
            ) {

                const firstPlace =
                    res.data.results[0]

                const newCenter = {

                    lat:
                        firstPlace.geometry.location.lat,

                    lng:
                        firstPlace.geometry.location.lng

                }

                setMapCenter(newCenter)

                map.panTo(newCenter)


                map.setZoom(15)

            }

        } catch (err) {

            console.error(err)

        }

    }
    const searchRoute = async () => {

        if (!origin || !destination) return

        try {

            const res =
                await axios.get(
                    "http://127.0.0.1:8000/route",
                    {
                        params: {
                            origin,
                            destination
                        }
                    }
                )

            setDistance(
                res.data.distance
            )

            setDuration(
                res.data.duration
            )

            setTravelMode(
                "자동차"
            )

            const decoded =
                decode(
                    res.data.polyline
                )

            const formattedPath =
                decoded.map(
                    ([lat, lng]) => ({
                        lat,
                        lng
                    })
                )

            setPath(
                formattedPath
            )

        } catch (err) {

            console.error(err)

        }

    }

    const searchByCategory = async (
        category: string
    ) => {

        if (!map) return

        setSelectedCategory(
            category
        )

        const center =
            map.getCenter()?.toJSON()

        if (!center) return

        try {

            const res =
                await axios.get(
                    "http://127.0.0.1:8000/nearby",
                    {
                        params: {

                            lat:
                                center.lat,

                            lng:
                                center.lng,

                            category

                        }
                    }
                )

            setPlaces(
                res.data.results
            )

            setMarkers(
                res.data.results
            )

        } catch (err) {

            console.error(err)

        }

    }

    return (

        <div

            className={`
                transition-all
                duration-300
                overflow-hidden
                bg-white
                border-l
                ${isOpen
                    ? "w-[1200px]"
                    : "w-0"
                }
            `}
        >

            {

                isOpen && (

                    <div className="h-full flex flex-col bg-white">

                        {/* 검색창 */}

                        <div className="p-4 border-b bg-white">

                            <div className="flex gap-2">

                                <input

                                    value={query}

                                    onChange={(e) =>
                                        setQuery(
                                            e.target.value
                                        )
                                    }

                                    placeholder="장소, 주소 검색"

                                    className="
                    flex-1
                    border
                    rounded-xl
                    px-4
                    py-3
                "
                                />

                                <button

                                    onClick={searchPlaces}

                                    className="
                    bg-blue-500
                    text-white
                    px-5
                    rounded-xl
                "
                                >

                                    검색

                                </button>

                            </div>
                        </div>

                        {/* 본문 */}

                        <div className="flex-1 flex overflow-hidden">

                            {/* 검색 결과 */}

                            <div
                                className="
                w-[380px]
                border-r
                overflow-y-auto
                bg-white
            "
                            >

                                {

                                    places.map(
                                        (
                                            place: any
                                        ) => (

                                            <div

                                                key={
                                                    place.place_id
                                                }

                                                onClick={() =>
                                                    setSelectedPlace(place)
                                                }

                                                className="
        p-4
        border-b
        hover:bg-gray-50
        cursor-pointer
    "
                                            >

                                                {/* 사진 */}

                                                {
                                                    place.photos?.[0] && (

                                                        <img
                                                            onClick={() =>
                                                                setSelectedPlace(place)
                                                            }

                                                            src={
                                                                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`
                                                            }

                                                            alt={place.name}

                                                            className="
                    w-full
                    h-40
                    object-cover
                    rounded-xl
                    mb-3
                "

                                                        />

                                                    )
                                                }

                                                {/* 이름 */}

                                                <div
                                                    className="
            font-semibold
            text-base
        "
                                                >
                                                    {place.name}
                                                </div>

                                                {/* 평점 */}

                                                <div
                                                    className="
            flex
            items-center
            gap-2
            mt-1
            text-sm
        "
                                                >

                                                    <span className="text-yellow-500">
                                                        ⭐ {place.rating ?? "-"}
                                                    </span>

                                                    {
                                                        place.user_ratings_total && (

                                                            <span
                                                                className="
                        text-gray-500
                    "
                                                            >
                                                                ({place.user_ratings_total})
                                                            </span>

                                                        )
                                                    }

                                                </div>

                                                {/* 주소 */}

                                                <div
                                                    className="
            text-sm
            text-gray-500
            mt-2
        "
                                                >
                                                    {
                                                        place.formatted_address
                                                        ||
                                                        place.vicinity
                                                    }
                                                </div>

                                                {/* 일정추가 */}

                                                <button

                                                    className="
            mt-3
            px-3
            py-2
            bg-blue-500
            text-white
            rounded-lg
            text-sm
        "
                                                >

                                                    일정 추가

                                                </button>

                                            </div>

                                        )
                                    )

                                }

                            </div>

                            {/* 지도 */}

                            <div className="flex-1 relative">
                                {/* 카테고리 */}
                                {
                                    !selectedPlace && (
                                        <div
                                            className="
        absolute
        top-14
        left-4
        z-20
        flex
        gap-2
        flex-wrap
    "
                                        >

                                            {categories.map((category) => (

                                                <button

                                                    key={category}

                                                    onClick={() =>
                                                        searchByCategory(category)
                                                    }

                                                    className={`
                px-4
                py-2
                rounded-full
                shadow-md
                text-sm
                font-medium
                border

                ${selectedCategory === category

                                                            ? `
                        bg-blue-500
                        text-white
                        border-blue-500
                        `

                                                            : `
                        bg-white
                        text-gray-700
                        border-gray-200
                        hover:bg-gray-50
                        `
                                                        }
            `}
                                                >

                                                    {category}

                                                </button>

                                            ))}

                                        </div>
                                    )
                                }
                                {

                                    isLoaded && (

                                        <GoogleMap

                                            onLoad={(
                                                mapInstance
                                            ) =>
                                                setMap(
                                                    mapInstance
                                                )
                                            }

                                            mapContainerStyle={{
                                                width: "100%",
                                                height: "100%"
                                            }}

                                            center={mapCenter}

                                            zoom={12}
                                        >

                                            {

                                                path.length > 0 && (

                                                    <Polyline

                                                        path={path}

                                                        options={{
                                                            strokeColor:
                                                                "#4285F4",

                                                            strokeWeight:
                                                                6
                                                        }}

                                                    />

                                                )

                                            }

                                            {

                                                markers.map(
                                                    (
                                                        place: any
                                                    ) => (

                                                        <Marker

                                                            key={
                                                                place.place_id
                                                            }

                                                            position={{
                                                                lat:
                                                                    place.geometry
                                                                        .location.lat,

                                                                lng:
                                                                    place.geometry
                                                                        .location.lng
                                                            }}

                                                            onClick={() =>
                                                                setSelectedPlace(
                                                                    place
                                                                )
                                                            }

                                                        />

                                                    )
                                                )

                                            }

                                        </GoogleMap>

                                    )


                                }
                                {
                                    selectedPlace && (

                                        <div

                                            className="
                absolute
                top-4
                left-4
                w-[400px]
                h-[90%]
                bg-white
                rounded-2xl
                shadow-2xl
                z-30
                overflow-y-auto
            "
                                        >

                                            {/* 닫기 */}

                                            <div
                                                className="
                    flex
                    justify-end
                    p-4
                "
                                            >

                                                <button

                                                    onClick={() =>
                                                        setSelectedPlace(
                                                            null
                                                        )
                                                    }

                                                    className="
                        text-2xl
                        font-bold
                    "
                                                >

                                                    ✕

                                                </button>

                                            </div>

                                            {/* 사진 */}

                                            {
                                                selectedPlace.photos?.[0] && (

                                                    <img

                                                        src={
                                                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${selectedPlace.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`
                                                        }

                                                        alt={
                                                            selectedPlace.name
                                                        }

                                                        className="
                            w-full
                            h-64
                            object-cover
                        "
                                                    />

                                                )
                                            }

                                            <div className="p-4">

                                                <h2
                                                    className="
                        text-2xl
                        font-bold
                    "
                                                >
                                                    {
                                                        selectedPlace.name
                                                    }
                                                </h2>

                                                <div
                                                    className="
                        mt-2
                        text-yellow-500
                        text-lg
                    "
                                                >

                                                    ⭐ {
                                                        selectedPlace.rating
                                                        ?? "-"
                                                    }

                                                </div>

                                                <div
                                                    className="
                        mt-4
                        text-gray-600
                    "
                                                >
                                                    {
                                                        selectedPlace.formatted_address
                                                        ||
                                                        selectedPlace.vicinity
                                                    }
                                                </div>

                                                <button

                                                    className="
                        mt-6
                        w-full
                        bg-blue-500
                        text-white
                        py-3
                        rounded-xl
                    "
                                                >

                                                    일정 추가

                                                </button>

                                            </div>

                                        </div>

                                    )
                                }

                            </div>

                        </div>

                    </div>

                )

            }

        </div>

    )

}