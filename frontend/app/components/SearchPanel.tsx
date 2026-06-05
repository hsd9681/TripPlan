"use client"

import { useEffect, useState } from "react"
import axios from "axios"

import {
    GoogleMap,
    Polyline,
    useJsApiLoader
} from "@react-google-maps/api"

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

    const [path, setPath] = useState<any[]>([])
    const [map, setMap] =
        useState<google.maps.Map | null>(null)

    const [query, setQuery] = useState("")
    const [places, setPlaces] =
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

    const { isLoaded } =
        useJsApiLoader({
            googleMapsApiKey:
                process.env
                    .NEXT_PUBLIC_GOOGLE_MAP_KEY!
        })

    useEffect(() => {

        if (!isOpen) return

        axios
            .get(
                "http://127.0.0.1:8000/route-test"
            )
            .then((res) => {

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

            })

    }, [isOpen])

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

        } catch (err) {

            console.error(err)

        }

    }

    const searchByCategory = async (
    category: string
) => {

    console.log("카테고리", category)

    const data =
        localStorage.getItem("tripInfo")

    console.log("tripInfo", data)

    if (!data) return

    const tripInfo =
        JSON.parse(data)

    const keyword =
        category === "전체"
            ? tripInfo.city
            : `${tripInfo.city} ${category}`

    console.log("검색어", keyword)

    try {

        const res =
            await axios.get(
                "http://127.0.0.1:8000/places",
                {
                    params: {
                        query: keyword
                    }
                }
            )

        console.log("응답", res.data)

        setPlaces(
            res.data.results
        )

    } catch (err) {

        console.error("에러", err)

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
                    ? "w-[700px]"
                    : "w-0"
                }
            `}
        >

            {

                isOpen && (

                    <div className="h-full flex flex-col">

                        {/* 검색창 */}

                        <div
                            className="
                                p-4
                                border-b
                                bg-white
                            "
                        >

                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                <input
                                    value={query}
                                    onChange={(e) =>
                                        setQuery(
                                            e.target.value
                                        )
                                    }
                                    placeholder="도쿄 스시"
                                    className="
                                        flex-1
                                        border
                                        rounded-lg
                                        px-3
                                        py-2
                                    "
                                />

                                <button

                                    onClick={
                                        searchPlaces
                                    }

                                    className="
                                        bg-blue-500
                                        text-white
                                        px-4
                                        rounded-lg
                                    "
                                >

                                    검색

                                </button>

                            </div>

                            {/* 카테고리 */}

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    gap-2
                                    mt-3
                                "
                            >

                                {
                                    categories.map(
                                        (
                                            category
                                        ) => (

                                            <button

                                                key={
                                                    category
                                                }

                                                onClick={() =>
                                                    searchByCategory(
                                                        category
                                                    )
                                                }

                                                className={`
                                                    px-3
                                                    py-2
                                                    rounded-full
                                                    text-sm
                                                    border

                                                    ${selectedCategory === category

                                                        ? `
                                                        bg-blue-500
                                                        text-white
                                                        border-blue-500
                                                        `

                                                        : `
                                                        bg-white
                                                        hover:bg-gray-100
                                                        `
                                                        }
                                                `}
                                            >

                                                {
                                                    category
                                                }

                                            </button>

                                        )
                                    )
                                }

                            </div>

                        </div>

                        {/* 지도 */}

                        <div
                            className="
                                flex-1
                                relative
                            "
                        >

                            <div

                                className="
                                    absolute
                                    top-10
                                    left-4
                                    z-10
                                    bg-white
                                    rounded-xl
                                    shadow
                                    p-4
                                "
                            >

                                <div>
                                    <strong>
                                        이동수단:
                                    </strong>
                                    {" "}
                                    {
                                        travelMode
                                    }
                                </div>

                                <div>
                                    <strong>
                                        거리:
                                    </strong>
                                    {" "}
                                    {
                                        distance
                                    }
                                </div>

                                <div>
                                    <strong>
                                        예상시간:
                                    </strong>
                                    {" "}
                                    {
                                        duration
                                    }
                                </div>

                            </div>

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

                                        center={{
                                            lat: 35.6764,
                                            lng: 139.6500
                                        }}

                                        zoom={12}
                                    >

                                        {

                                            path.length > 0 && (

                                                <Polyline

                                                    path={
                                                        path
                                                    }

                                                    options={{
                                                        strokeColor:
                                                            "#4285F4",

                                                        strokeWeight:
                                                            6
                                                    }}

                                                />

                                            )

                                        }

                                    </GoogleMap>

                                )

                            }

                        </div>

                        {/* 검색 결과 */}

                        <div
                            className="
                                h-64
                                overflow-y-auto
                                border-t
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

                                            className="
                                                flex
                                                justify-between
                                                items-center
                                                p-4
                                                border-b
                                            "
                                        >

                                            <div>

                                                <div
                                                    className="
                                                        font-medium
                                                    "
                                                >
                                                    {
                                                        place.name
                                                    }
                                                </div>

                                                <div
                                                    className="
                                                        text-sm
                                                        text-gray-500
                                                    "
                                                >
                                                    {
                                                        place.formatted_address
                                                    }
                                                </div>

                                            </div>

                                            <button

                                                onClick={() => {

                                                    alert(
                                                        "DAY 추가 예정"
                                                    )

                                                }}

                                                className="
                                                    bg-blue-500
                                                    text-white
                                                    px-3
                                                    py-2
                                                    rounded-lg
                                                "
                                            >

                                                추가

                                            </button>

                                        </div>

                                    )
                                )
                            }

                        </div>

                    </div>

                )

            }

        </div>

    )

}