"use client"

import { useEffect, useState } from "react"

import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"

import {
    useTrip
} from "../../../context/TripContext"

import {
    useSearchPanel
} from "../../../context/SearchPanelContext"

import {

    GoogleMap,

    DirectionsRenderer,

    useJsApiLoader,

    Marker,

    InfoWindow

} from "@react-google-maps/api"


export default function TripDetailPage() {

    const params = useParams()

    const tripId = Number(
        params.tripId
    )

    const [activeTab, setActiveTab] =
        useState("schedule")

    const [selectedDay, setSelectedDay] =
        useState(1)

    const [
        directions,
        setDirections
    ] = useState<any>(null)

    const {
        isLoaded
    } = useJsApiLoader({

        googleMapsApiKey:
            process.env
                .NEXT_PUBLIC_GOOGLE_MAP_KEY!

    })

    const router = useRouter()

    const createRoute = (
        day: number
    ) => {

        const places =
            schedule[day] || []

        if (
            places.length < 2
        ) {

            setDirections(
                null
            )

            return

        }

        const origin = {

            lat:
                places[0].lat,

            lng:
                places[0].lng

        }

        const destination = {

            lat:
                places[
                    places.length - 1
                ].lat,

            lng:
                places[
                    places.length - 1
                ].lng

        }

        const waypoints =

            places

                .slice(
                    1,
                    places.length - 1
                )

                .map(
                    (
                        place: any
                    ) => ({

                        location: {

                            lat:
                                place.lat,

                            lng:
                                place.lng

                        },

                        stopover: true

                    })
                )

        const directionsService =

            new google.maps
                .DirectionsService()

        directionsService.route({

            origin,

            destination,

            waypoints,

            optimizeWaypoints:
                false,

            travelMode:

                google.maps
                    .TravelMode
                    .WALKING

        })

            .then(

                (
                    result
                ) => {

                    setDirections(
                        result
                    )

                }

            )

    }


    useEffect(() => {

        api.get(

            "me",

        )

            .then((res) => {

                console.log(schedule)

            })

    }, [])

    const calculateTime = (
        items: any[],
        index: number
    ) => {

        let minutes =

            9 * 60

        for (
            let i = 0;
            i < index;
            i++
        ) {

            minutes +=
                items[i].duration

        }

        const hour =
            Math.floor(
                minutes / 60
            )

        const minute =
            minutes % 60

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

    }
    const removePlace = async (
        index: number
    ) => {

        const place =

            schedule[
            selectedDay
            ][index]

        await api.delete(

            `schedule/${place.id}`

        )

        const updatedSchedule = {
            ...schedule
        }

        updatedSchedule[
            selectedDay
        ] = updatedSchedule[
            selectedDay
        ].filter(
            (_: any, i: number) =>
                i !== index
        )

        setSchedule(
            updatedSchedule
        )

    }

    const moveUp = async (
        index: number
    ) => {

        if (
            index === 0
        ) return

        const updatedSchedule = {
            ...schedule
        }

        const daySchedule =
            [...updatedSchedule[
                selectedDay
            ]]

            ;[
                daySchedule[
                index - 1
                ],

                daySchedule[
                index
                ]

            ] = [

                    daySchedule[
                    index
                    ],

                    daySchedule[
                    index - 1
                    ]

                ]

        updatedSchedule[
            selectedDay
        ] = daySchedule

        setSchedule(
            updatedSchedule
        )


        await api.put(

            "schedule/order",

            daySchedule.map(

                (
                    item: any,
                    idx: number
                ) => ({

                    id: item.id,

                    order_no:
                        idx + 1

                })

            )

        )

    }
    const moveDown = async (
        index: number
    ) => {

        const daySchedule =
            schedule[
            selectedDay
            ] || []

        if (
            index ===
            daySchedule.length - 1
        ) return

        const updatedSchedule = {
            ...schedule
        }

        const copied =
            [...daySchedule]

            ;[
                copied[index],

                copied[index + 1]

            ] = [

                    copied[index + 1],

                    copied[index]

                ]

        updatedSchedule[
            selectedDay
        ] = copied

        setSchedule(
            updatedSchedule
        )

        await api.put(

            "schedule/order",

            copied.map(

                (
                    item: any,
                    idx: number
                ) => ({

                    id: item.id,

                    order_no:
                        idx + 1

                })

            )

        )

    }

    useEffect(() => {




        api
            .get(
                `schedule/${tripId}`
            )

            .then((res) => {

                console.log(
                    "DB 응답",
                    res.data
                )

                if (

                    res.data.message ===
                    "unauthorized"

                ) {

                    router.push(
                        "/login"
                    )

                    return

                }

                if (

                    res.data.message ===
                    "forbidden"

                ) {

                    router.push(
                        "/trip/result"
                    )

                    return

                }

                const grouped: any = {}

                res.data.forEach(
                    (item: any) => {

                        grouped[
                            item.day_number
                        ] ??= []

                        grouped[
                            item.day_number
                        ].push(item)

                    }
                )

                setSchedule(
                    grouped
                )

            })

    }, [tripId])


    const {

        schedule,
        setSchedule,

        setSelectedDay:
        setScheduleDay,

        setScheduleMode,

        editingIndex,
        setEditingIndex

    } = useTrip()

    const {
        openPanel
    } = useSearchPanel()

    useEffect(() => {

        if (
            activeTab === "map"
        ) {

            createRoute(
                selectedDay
            )

        }

    }, [

        selectedDay,

        activeTab,

        schedule

    ])

    const [
        selectedMarker,
        setSelectedMarker
    ] = useState<any>(null)

    const [
        activeBudgetTab,
        setActiveBudgetTab
    ] = useState("walking")

    return (

        <main
            className="
            max-w-7xl
            mx-auto
            p-8
        "
        >

            <div
                className="
                bg-white
                border
                border-[#ECEEF2]
                rounded-3xl
                p-8
            "
            >

                {/* 상단 */}

                <div
                    className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-[#ECEEF2]
                    pb-4
                    mb-6
                "
                >

                    <h1
                        className="
                        text-3xl
                        font-bold
                    "
                    >
                        도쿄 4박 5일
                    </h1>

                    <div
                        className="
                        flex
                        gap-25
                        ml-100
                    "
                    >

                        <button

                            onClick={() =>
                                setActiveTab(
                                    "schedule"
                                )
                            }

                            className={`
                            transition
                            font-medium

                            ${activeTab ===
                                    "schedule"

                                    ? "text-blue-500"

                                    : "text-gray-500"
                                }
                        `}
                        >

                            일정

                        </button>

                        <button

                            onClick={() =>
                                setActiveTab(
                                    "map"
                                )
                            }

                            className={`
                            transition
                            font-medium

                            ${activeTab ===
                                    "map"

                                    ? "text-blue-500"

                                    : "text-gray-500"
                                }
                        `}
                        >

                            지도

                        </button>

                        <button

                            onClick={() =>
                                setActiveTab(
                                    "budget"
                                )
                            }

                            className={`
                            transition
                            font-medium

                            ${activeTab ===
                                    "budget"

                                    ? "text-blue-500"

                                    : "text-gray-500"
                                }
                        `}
                        >

                            예산

                        </button>

                    </div>

                </div>

                {/* 일정 탭 */}

                {

                    activeTab ===
                    "schedule" && (

                        <div
                            className="
                            flex
                            gap-6
                        "
                        >

                            {/* DAY 영역 */}

                            <div
                                className="
                                w-[140px]
                                border
                                border-[#ECEEF2]
                                rounded-2xl
                                p-3
                                h-fit
                            "
                            >

                                {

                                    [1, 2, 3, 4, 5]
                                        .map(
                                            (
                                                day
                                            ) => (

                                                <button

                                                    key={
                                                        day
                                                    }

                                                    onClick={() =>
                                                        setSelectedDay(
                                                            day
                                                        )
                                                    }

                                                    className={`
                                                    w-full
                                                    p-3
                                                    mb-2
                                                    rounded-xl
                                                    text-left
                                                    transition

                                                    ${selectedDay === day

                                                            ? "bg-blue-500 text-white"

                                                            : "border border-[#ECEEF2] bg-white"
                                                        }
                                                `}
                                                >

                                                    DAY {day}

                                                </button>

                                            )
                                        )

                                }

                            </div>

                            {/* 일정 영역 */}

                            <div
                                className="
                                flex-1
                                border
                                border-[#ECEEF2]
                                rounded-2xl
                                p-6
                                min-h-[700px]
                            "
                            >

                                <h2
                                    className="
                                    text-xl
                                    font-bold
                                    mb-4
                                "
                                >
                                    DAY {selectedDay}
                                </h2>

                                <div
                                    className="
        space-y-6
    "
                                >

                                    {/* 일정 목록 */}

                                    {
                                        (schedule[selectedDay] || []).map(
                                            (
                                                place: any,
                                                index: number
                                            ) => (

                                                <div
                                                    key={index}
                                                    className="
                    flex
                    items-start
                    gap-6
                "
                                                >

                                                    {/* 시간 */}

                                                    <div
                                                        className="
                        w-[70px]
                        text-gray-700
                        font-medium
                    "
                                                    >

                                                        {
                                                            calculateTime(
                                                                schedule[
                                                                selectedDay
                                                                ] || [],
                                                                index
                                                            )
                                                        }

                                                    </div>

                                                    {/* 타임라인 */}

                                                    <div
                                                        className="
                        flex
                        flex-col
                        items-center
                    "
                                                    >

                                                        <div
                                                            className="
                            w-3
                            h-3
                            rounded-full
                            border-2
                            border-blue-500
                            bg-white
                        "
                                                        />

                                                        {
                                                            index !==
                                                            (
                                                                schedule[
                                                                selectedDay
                                                                ] || []
                                                            ).length - 1 && (

                                                                <div
                                                                    className="
                                    w-[2px]
                                    h-20
                                    bg-[#ECEEF2]
                                "
                                                                />

                                                            )
                                                        }

                                                    </div>

                                                    {/* 일정 정보 */}

                                                    <div
                                                        className="
        flex-1
        flex
        gap-4
        items-center
    "
                                                    >

                                                        {

                                                            place.photo && (

                                                                <img

                                                                    src={

                                                                        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`

                                                                    }

                                                                    alt={
                                                                        place.name
                                                                    }

                                                                    className="
                    w-24
                    h-24
                    rounded-xl
                    object-cover
                    flex-shrink-0
                "

                                                                />

                                                            )

                                                        }

                                                        <div>

                                                            <div
                                                                className="
                font-semibold
                text-lg
            "
                                                            >

                                                                {place.name}

                                                            </div>

                                                            <div
                                                                className="
                text-sm
                text-gray-500
                mt-1
            "
                                                            >

                                                                {place.category}

                                                            </div>

                                                            <div
                                                                className="
                text-sm
                text-gray-400
                mt-1
            "
                                                            >

                                                                예상 소요시간
                                                                {" "}
                                                                {place.duration}
                                                                분

                                                            </div>

                                                        </div>

                                                    </div>
                                                    <div
                                                        className="
        ml-auto
        flex
        flex-col
        items-end
        gap-2
        self-start
    "
                                                    >

                                                        {/* 수정 + 삭제 */}

                                                        <div
                                                            className="
            flex
            gap-2
        "
                                                        >

                                                            <button

                                                                onClick={() => {

                                                                    setEditingIndex(index)

                                                                    setScheduleDay(
                                                                        selectedDay
                                                                    )

                                                                    openPanel()

                                                                }}

                                                                className="
        text-blue-500
        text-lg
    "

                                                            >

                                                                ✏

                                                            </button>

                                                            <button

                                                                onClick={() =>
                                                                    removePlace(index)
                                                                }

                                                                className="
                text-red-500
                text-xl
                leading-none
            "

                                                            >

                                                                X

                                                            </button>

                                                        </div>

                                                        {/* 위 */}

                                                        <button

                                                            onClick={() =>
                                                                moveUp(index)
                                                            }

                                                            className="
            w-8
            h-8
            border
            rounded-lg
        "

                                                        >

                                                            ↑

                                                        </button>

                                                        {/* 아래 */}

                                                        <button

                                                            onClick={() =>
                                                                moveDown(index)
                                                            }

                                                            className="
            px-3
            py-1
            border
            rounded-lg
        "

                                                        >

                                                            ↓

                                                        </button>

                                                    </div>

                                                </div>

                                            )
                                        )
                                    }

                                    {/* 일정 추가 */}

                                    <button

                                        onClick={() => {

                                            setScheduleDay(
                                                selectedDay
                                            )

                                            setScheduleMode(
                                                true
                                            )

                                            openPanel()

                                        }}

                                        className="
        w-full
        border
        border-[#ECEEF2]
        rounded-xl
        py-3
        text-blue-500
        font-semibold
        hover:bg-blue-50
    "

                                    >

                                        + 일정 추가

                                    </button>

                                </div>

                            </div>

                        </div>

                    )

                }

                {/* 지도 탭 */}

                {

                    activeTab ===
                    "map" && (

                        <div
                            className="
                            flex
                            gap-6
                        "
                        >

                            {/* DAY 영역 */}

                            <div
                                className="
                                w-[140px]
                                border
                                border-[#ECEEF2]
                                rounded-2xl
                                p-3
                                h-fit
                            "
                            >

                                {

                                    [1, 2, 3, 4, 5]
                                        .map(
                                            (
                                                day
                                            ) => (

                                                <button

                                                    key={
                                                        day
                                                    }

                                                    onClick={() =>
                                                        setSelectedDay(
                                                            day
                                                        )
                                                    }

                                                    className={`
                                                    w-full
                                                    p-3
                                                    mb-2
                                                    rounded-xl
                                                    text-left
                                                    transition

                                                    ${selectedDay === day

                                                            ? "bg-blue-500 text-white"

                                                            : "border border-[#ECEEF2] bg-white"
                                                        }
                                                `}
                                                >

                                                    DAY {day}

                                                </button>

                                            )
                                        )

                                }

                            </div>

                            {/* 지도 영역 */}
                            <div
                                className="
        flex-1
        border
        border-[#ECEEF2]
        rounded-2xl
        overflow-hidden
        min-h-[700px]
    "
                            >

                                {

                                    isLoaded && (

                                        <GoogleMap

                                            mapContainerStyle={{

                                                width: "100%",

                                                height: "700px"

                                            }}

                                            zoom={13}

                                            center={{

                                                lat: 35.6764,

                                                lng: 139.6500

                                            }}

                                        >

                                            {

                                                directions && (

                                                    <DirectionsRenderer
                                                        directions={directions}
                                                        options={{
                                                            suppressMarkers: true
                                                        }}
                                                    />
                                                )


                                            }
                                            {
                                                (schedule[selectedDay] || [])
                                                    .map(

                                                        (
                                                            place: any,
                                                            index: number
                                                        ) => (

                                                            <Marker

                                                                key={index}

                                                                position={{

                                                                    lat:
                                                                        place.lat,

                                                                    lng:
                                                                        place.lng

                                                                }}

                                                                onClick={() =>

                                                                    setSelectedMarker(
                                                                        place
                                                                    )

                                                                }

                                                            />

                                                        )

                                                    )
                                            }
                                            {
                                                selectedMarker && (

                                                    <InfoWindow

                                                        position={{

                                                            lat:
                                                                selectedMarker.lat,

                                                            lng:
                                                                selectedMarker.lng

                                                        }}

                                                        onCloseClick={() =>
                                                            setSelectedMarker(
                                                                null
                                                            )
                                                        }

                                                    >

                                                        <div
                                                            className="
                    w-[200px]
                "
                                                        >

                                                            {

                                                                selectedMarker.photo && (

                                                                    <img

                                                                        src={

                                                                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedMarker.photo}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`

                                                                        }

                                                                        alt={
                                                                            selectedMarker.name
                                                                        }

                                                                        className="
                                w-full
                                h-28
                                object-cover
                                rounded-lg
                                mb-2
                            "

                                                                    />

                                                                )

                                                            }

                                                            <div
                                                                className="
                        font-bold
                        text-lg
                    "
                                                            >

                                                                {
                                                                    selectedMarker.name
                                                                }

                                                            </div>

                                                            <div
                                                                className="
                        text-sm
                        text-gray-500
                    "
                                                            >

                                                                {
                                                                    selectedMarker.category
                                                                }

                                                            </div>
                                                            {
                                                                selectedMarker.rating && (
                                                                    <div
                                                                        className="
                text-sm
                text-yellow-500
                mt-1
            "
                                                                    >
                                                                        ★ {selectedMarker.rating}
                                                                    </div>
                                                                )
                                                            }

                                                        </div>

                                                    </InfoWindow>

                                                )
                                            }

                                        </GoogleMap>

                                    )

                                }

                            </div>

                        </div>

                    )

                }

                {/* 예산 탭 */}

                {
                    activeTab === "budget" && (

                        <div
                            className="
                space-y-6
            "
                        >

                            {/* 총 예산 */}

                            <div
                                className="
                    border
                    border-[#ECEEF2]
                    rounded-2xl
                    p-6
                "
                            >

                                <div
                                    className="
                        text-gray-500
                    "
                                >

                                    총 예산

                                </div>

                                <div
                                    className="
                        text-4xl
                        font-bold
                        mt-2
                    "
                                >

                                    ¥15,000

                                </div>

                            </div>

                            {/* 교통수단 탭 */}

                            <div
                                className="
                    flex
                    gap-3
                "
                            >

                                <button
                                    onClick={() =>
                                        setActiveBudgetTab(
                                            "walking"
                                        )
                                    }
                                    className={`
                        px-5
                        py-3
                        rounded-xl
                        border

                        ${activeBudgetTab === "walking"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white border-[#ECEEF2]"
                                        }
                    `}
                                >

                                    도보

                                </button>

                                <button
                                    onClick={() =>
                                        setActiveBudgetTab(
                                            "transit"
                                        )
                                    }
                                    className={`
                        px-5
                        py-3
                        rounded-xl
                        border

                        ${activeBudgetTab === "transit"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white border-[#ECEEF2]"
                                        }
                    `}
                                >

                                    대중교통

                                </button>

                                <button
                                    onClick={() =>
                                        setActiveBudgetTab(
                                            "driving"
                                        )
                                    }
                                    className={`
                        px-5
                        py-3
                        rounded-xl
                        border

                        ${activeBudgetTab === "driving"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white border-[#ECEEF2]"
                                        }
                    `}
                                >

                                    차량

                                </button>

                            </div>

                            {/* 비용 요약 */}

                            <div
                                className="
                    border
                    border-[#ECEEF2]
                    rounded-2xl
                    p-6
                "
                            >

                                <div
                                    className="
                        grid
                        grid-cols-2
                        gap-6
                    "
                                >

                                    <div>

                                        <div
                                            className="
                                text-gray-500
                            "
                                        >

                                            교통비

                                        </div>

                                        <div
                                            className="
                                text-xl
                                font-bold
                            "
                                        >

                                            {
                                                activeBudgetTab === "walking"
                                                    ? "¥0"
                                                    : activeBudgetTab === "transit"
                                                        ? "¥1,250"
                                                        : "¥9,850"
                                            }

                                        </div>

                                    </div>

                                    <div>

                                        <div
                                            className="
                                text-gray-500
                            "
                                        >

                                            식비

                                        </div>

                                        <div
                                            className="
                                text-xl
                                font-bold
                            "
                                        >

                                            ¥7,600

                                        </div>

                                    </div>

                                    <div>

                                        <div
                                            className="
                                text-gray-500
                            "
                                        >

                                            입장료

                                        </div>

                                        <div
                                            className="
                                text-xl
                                font-bold
                            "
                                        >

                                            ¥1,000

                                        </div>

                                    </div>

                                    <div>

                                        <div
                                            className="
                                text-gray-500
                            "
                                        >

                                            쇼핑

                                        </div>

                                        <div
                                            className="
                                text-xl
                                font-bold
                            "
                                        >

                                            ¥6,400

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )
                }

            </div>

        </main>

    )

}
