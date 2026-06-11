"use client"

import { useEffect, useState } from "react"

import {
    useTrip
} from "../../../context/TripContext"

import {
    useSearchPanel
} from "../../../context/SearchPanelContext"


export default function TripDetailPage() {

    const [activeTab, setActiveTab] =
        useState("schedule")

    const [selectedDay, setSelectedDay] =
        useState(1)

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

    useEffect(() => {

        const savedSchedule =

            localStorage.getItem(
                "schedule"
            )

        if (
            savedSchedule
        ) {

            setSchedule(
                JSON.parse(
                    savedSchedule
                )
            )

        }

    }, [])


    const {

        schedule,
        setSchedule,

        setSelectedDay:
        setScheduleDay,

        setScheduleMode

    } = useTrip()

    const {
        openPanel
    } = useSearchPanel()



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
                                    text-gray-500
                                "
                                >
                                    지도 화면 입니다
                                </div>

                            </div>

                        </div>

                    )

                }

                {/* 예산 탭 */}

                {

                    activeTab ===
                    "budget" && (

                        <div
                            className="
                            border
                            border-[#ECEEF2]
                            rounded-2xl
                            p-6
                            min-h-[700px]
                        "
                        >

                            <h2
                                className="
                                text-2xl
                                font-bold
                                mb-8
                            "
                            >
                                전체 여행 예산
                            </h2>

                            <div
                                className="
                                text-4xl
                                font-bold
                                mb-10
                            "
                            >
                                ₩ 0
                            </div>

                            <div
                                className="
                                space-y-4
                            "
                            >

                                {

                                    [1, 2, 3, 4, 5]
                                        .map(
                                            (
                                                day
                                            ) => (

                                                <div

                                                    key={
                                                        day
                                                    }

                                                    className="
                                                    border
                                                    border-[#ECEEF2]
                                                    rounded-xl
                                                    p-4
                                                    flex
                                                    justify-between
                                                "
                                                >

                                                    <span>
                                                        DAY {day}
                                                    </span>

                                                    <span>
                                                        ₩ 0
                                                    </span>

                                                </div>

                                            )
                                        )

                                }

                            </div>

                        </div>

                    )

                }

            </div>

        </main>

    )

}
