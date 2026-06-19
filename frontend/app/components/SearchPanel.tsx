"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams } from "next/navigation"

import { GoogleMap, Polyline, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"

import { decode } from "@googlemaps/polyline-codec"

import {
    useSearchPanel
} from "../context/SearchPanelContext"

import {
    useTrip
}
    from "../context/TripContext"

export default function SearchPanel() {

    const params = useParams()

    const tripId = Number(
        params.tripId
    )

    const {
        isOpen
    } = useSearchPanel()

    const {

        selectedDay,
        scheduleMode,

        schedule,
        setSchedule

    } = useTrip()

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
    const openPlaceDetail = async (
        place: any
    ) => {

        const res =
            await axios.get(
                "http://127.0.0.1:8000/place-detail",
                {
                    params: {
                        place_id:
                            place.place_id
                    }
                }
            )

        setSelectedPlace(
            res.data.result
        )

    }
    const getDefaultDuration = (
        types: string[]
    ) => {

        if (
            types?.includes("restaurant")
        )
            return 90

        if (
            types?.includes("cafe")
        )
            return 60

        if (
            types?.includes("shopping_mall")
        )
            return 180

        if (
            types?.includes("lodging")
        )
            return 0

        return 120

    }
    const getCategory = (
        types: string[]
    ) => {

        if (
            types?.includes(
                "restaurant"
            )
        )
            return "맛집"

        if (
            types?.includes(
                "cafe"
            )
        )
            return "카페"

        if (
            types?.includes(
                "shopping_mall"
            )
        )
            return "쇼핑"

        if (
            types?.includes(
                "lodging"
            )
        )
            return "숙소"

        return "관광지"

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
                                                    openPlaceDetail(place)
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
                                                                openPlaceDetail(place)
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

                                                    상세정보

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
                                                                openPlaceDetail(place)
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
                w-[420px]
                h-[90%]
                bg-white
                rounded-2xl
                shadow-2xl
                z-30
                overflow-y-auto

                transition-all
                duration-300
            "
                                        >

                                            {/* 닫기 */}

                                            <div
                                                className="
                    flex
                    justify-end
                    p-4
                    sticky
                    top-0
                    bg-white
                    z-10
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

                                            {/* 대표사진 */}

                                            {
                                                selectedPlace.photos?.[0] && (

                                                    <img

                                                        src={
                                                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${selectedPlace.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`
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

                                            <div className="p-5">

                                                {/* 이름 */}

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

                                                {/* 평점 */}

                                                <div
                                                    className="
                        mt-2
                        text-lg
                    "
                                                >

                                                    ⭐ {
                                                        selectedPlace.rating
                                                        ?? "-"
                                                    }

                                                    <span
                                                        className="
                            text-gray-500
                            ml-2
                        "
                                                    >

                                                        (
                                                        {
                                                            selectedPlace.user_ratings_total
                                                        }
                                                        개 리뷰)

                                                    </span>

                                                </div>

                                                {/* 가격대 */}

                                                {
                                                    selectedPlace.price_level && (

                                                        <div
                                                            className="
                                mt-2
                                text-gray-700
                            "
                                                        >

                                                            가격대 :

                                                            {
                                                                selectedPlace.price_level === 1 &&
                                                                " 💰 저렴"
                                                            }

                                                            {
                                                                selectedPlace.price_level === 2 &&
                                                                " 💰💰 보통"
                                                            }

                                                            {
                                                                selectedPlace.price_level === 3 &&
                                                                " 💰💰💰 비쌈"
                                                            }

                                                            {
                                                                selectedPlace.price_level === 4 &&
                                                                " 💰💰💰💰 매우 비쌈"
                                                            }

                                                        </div>

                                                    )
                                                }

                                                {/* 영업상태 */}

                                                {
                                                    selectedPlace.current_opening_hours && (

                                                        <div
                                                            className="
                                mt-2
                                font-medium
                            "
                                                        >

                                                            {
                                                                selectedPlace
                                                                    .current_opening_hours
                                                                    ?.open_now

                                                                    ? "🟢 영업중"

                                                                    : "🔴 영업종료"
                                                            }

                                                        </div>

                                                    )
                                                }

                                                {/* 설명 */}

                                                {
                                                    selectedPlace
                                                        .editorial_summary
                                                        ?.overview && (

                                                        <div
                                                            className="
                                    mt-4
                                    text-gray-700
                                "
                                                        >

                                                            {
                                                                selectedPlace
                                                                    .editorial_summary
                                                                    .overview
                                                            }

                                                        </div>

                                                    )
                                                }

                                                {/* 주소 */}

                                                <div
                                                    className="
                        mt-5
                    "
                                                >

                                                    <div
                                                        className="
                            font-semibold
                        "
                                                    >
                                                        주소
                                                    </div>

                                                    <div
                                                        className="
                            text-gray-600
                            mt-1
                        "
                                                    >
                                                        {
                                                            selectedPlace.formatted_address
                                                            ||
                                                            selectedPlace.vicinity
                                                        }
                                                    </div>

                                                </div>

                                                {/* 전화번호 */}

                                                {
                                                    selectedPlace.formatted_phone_number && (

                                                        <div
                                                            className="
                                mt-5
                            "
                                                        >

                                                            <div
                                                                className="
                                    font-semibold
                                "
                                                            >
                                                                전화번호
                                                            </div>

                                                            <div
                                                                className="
                                    text-gray-600
                                    mt-1
                                "
                                                            >
                                                                {
                                                                    selectedPlace
                                                                        .formatted_phone_number
                                                                }
                                                            </div>

                                                        </div>

                                                    )
                                                }

                                                {/* 웹사이트 */}

                                                {
                                                    selectedPlace.website && (

                                                        <div
                                                            className="
                                mt-5
                            "
                                                        >

                                                            <div
                                                                className="
                                    font-semibold
                                "
                                                            >
                                                                웹사이트
                                                            </div>

                                                            <a

                                                                href={
                                                                    selectedPlace.website
                                                                }

                                                                target="_blank"

                                                                className="
                                    text-blue-500
                                    break-all
                                "
                                                            >

                                                                {
                                                                    selectedPlace.website
                                                                }

                                                            </a>

                                                        </div>

                                                    )
                                                }

                                                {/* 영업시간 */}

                                                {
                                                    selectedPlace
                                                        .opening_hours
                                                        ?.weekday_text && (

                                                        <div
                                                            className="
                                    mt-5
                                "
                                                        >

                                                            <div
                                                                className="
                                        font-semibold
                                        mb-2
                                    "
                                                            >
                                                                영업시간
                                                            </div>

                                                            {

                                                                selectedPlace
                                                                    .opening_hours
                                                                    .weekday_text
                                                                    .map(
                                                                        (
                                                                            day: string
                                                                        ) => (

                                                                            <div

                                                                                key={
                                                                                    day
                                                                                }

                                                                                className="
                                                        text-sm
                                                        text-gray-600
                                                    "
                                                                            >

                                                                                {
                                                                                    day
                                                                                }

                                                                            </div>

                                                                        )
                                                                    )

                                                            }

                                                        </div>

                                                    )
                                                }

                                                {/* 리뷰 */}

                                                {
                                                    selectedPlace.reviews
                                                        ?.length > 0 && (

                                                        <div
                                                            className="
                                    mt-6
                                "
                                                        >

                                                            <div
                                                                className="
                                        font-semibold
                                        mb-3
                                    "
                                                            >
                                                                리뷰
                                                            </div>

                                                            {

                                                                selectedPlace
                                                                    .reviews
                                                                    .map(
                                                                        (
                                                                            review: any
                                                                        ) => (

                                                                            <div

                                                                                key={
                                                                                    review.time
                                                                                }

                                                                                className="
                                                        border-t
                                                        pt-3
                                                        mt-3
                                                    "
                                                                            >

                                                                                <div
                                                                                    className="
                                                            font-medium
                                                        "
                                                                                >
                                                                                    {
                                                                                        review.author_name
                                                                                    }
                                                                                </div>

                                                                                <div>
                                                                                    ⭐ {
                                                                                        review.rating
                                                                                    }
                                                                                </div>

                                                                                <div
                                                                                    className="
                                                            text-sm
                                                            text-gray-600
                                                            mt-1
                                                        "
                                                                                >
                                                                                    {
                                                                                        review.text
                                                                                    }
                                                                                </div>

                                                                            </div>

                                                                        )
                                                                    )

                                                            }

                                                        </div>

                                                    )
                                                }

                                                {/* 버튼 */}

                                                <div
                                                    className="
                        mt-8
                        flex
                        gap-3
                    "
                                                >

                                                    <button

                                                        onClick={async () => {

                                                            if (
                                                                !scheduleMode ||
                                                                !selectedDay
                                                            ) {

                                                                alert(
                                                                    "DAY를 먼저 선택해주세요."
                                                                )

                                                                return

                                                            }

                                                            const newPlace = {

                                                                trip_id:
                                                                    tripId,

                                                                day_number:
                                                                    selectedDay,

                                                                order_no:
                                                                    (
                                                                        schedule[
                                                                            selectedDay
                                                                        ]?.length || 0
                                                                    ) + 1,

                                                                place_id:
                                                                    selectedPlace.place_id,

                                                                name:
                                                                    selectedPlace.name,

                                                                category:
                                                                    getCategory(
                                                                        selectedPlace.types
                                                                    ),

                                                                photo:
                                                                    selectedPlace.photos?.[0]
                                                                        ?.photo_reference,

                                                                rating:
                                                                    selectedPlace.rating,

                                                                address:
                                                                    selectedPlace.formatted_address,

                                                                duration:
                                                                    getDefaultDuration(
                                                                        selectedPlace.types
                                                                    ),

                                                                lat:
                                                                    selectedPlace.geometry.location.lat,

                                                                lng:
                                                                    selectedPlace.geometry.location.lng

                                                            }
                                                            await axios.post(

                                                                "http://127.0.0.1:8000/schedule",

                                                                newPlace

                                                            )
                                                            const updatedSchedule = {
                                                                ...schedule
                                                            }

                                                            updatedSchedule[selectedDay] ??= []

                                                            updatedSchedule[selectedDay].push(
                                                                newPlace
                                                            )

                                                            setSchedule(
                                                                updatedSchedule
                                                            )

                                                            alert(
                                                                `DAY ${selectedDay}에 추가되었습니다`
                                                            )

                                                        }}

                                                        className="
        flex-1
        bg-blue-500
        text-white
        py-3
        rounded-xl
    "

                                                    >

                                                        일정 추가

                                                    </button>

                                                    <button

                                                        className="
                            flex-1
                            border
                            py-3
                            rounded-xl
                        "
                                                    >

                                                        길찾기

                                                    </button>

                                                </div>

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