"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function TripResultPage() {

    const router = useRouter()

    const [tripInfo, setTripInfo] =
        useState<any>(null)

    const [schedule, setSchedule] =
        useState<any>({})

    useEffect(() => {

        const tripData =
            localStorage.getItem(
                "tripInfo"
            )

        if (tripData) {

            setTripInfo(
                JSON.parse(tripData)
            )

        }

        const scheduleData =
            localStorage.getItem(
                "schedule"
            )

        if (scheduleData) {

            setSchedule(
                JSON.parse(
                    scheduleData
                )
            )

        }

    }, [])

    if (!tripInfo) {

        return (

            <main
                className="
                p-10
            "
            >

                <h1>
                    데이터 없음
                </h1>

            </main>

        )

    }

    const totalPlaces =

        Object.values(
            schedule
        )
            .flat()
            .length

    const tripDays =

        Math.floor(

            (

                new Date(
                    tripInfo.endDate
                ).getTime()

                -

                new Date(
                    tripInfo.startDate
                ).getTime()

            )

            /

            (
                1000 *
                60 *
                60 *
                24
            )

        ) + 1

    return (

        <main

            className="
            max-w-6xl
            mx-auto
            px-8
            py-10
        "

        >

            <div

                className="
                flex
                justify-between
                items-center
                mb-10
            "

            >

                <h1

                    className="
                    text-4xl
                    font-bold
                "

                >

                    내 여행 일정

                </h1>

                <button

                    className="
                    bg-blue-500
                    text-white
                    px-5
                    py-3
                    rounded-xl
                "

                >

                    + 여행 만들기

                </button>

            </div>

            <div

                className="
                grid
                md:grid-cols-2
                lg:grid-cols-3
                gap-8
            "

            >

                <div

                    className="
                    bg-white
                    rounded-3xl
                    overflow-hidden
                    shadow-lg
                    cursor-pointer
                    hover:shadow-2xl
                    hover:-translate-y-1
                    transition-all
                    duration-300
                "
                >

                    <img

                        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200"

                        alt="trip"

                        className="
                        w-full
                        h-64
                        object-cover
                    "

                    />

                    <div className="p-6">

                        <div

                            className="
                            text-2xl
                            font-bold
                        "

                        >
                            {" "}
                            {tripInfo.city}
                            {" "}
                            여행

                        </div>

                        <div

                            className="
                            text-gray-500
                            mt-2
                        "

                        >

                            {tripInfo.startDate}

                            {" ~ "}

                            {tripInfo.endDate}

                        </div>

                        <div

                            className="
                            mt-5
                            text-gray-700
                        "

                        >

                            {tripDays}
                            일 일정

                        </div>

                        <div

                            className="
                            mt-2
                            text-gray-700
                        "

                        >

                            장소
                            {" "}
                            {totalPlaces}
                            개

                        </div>

                        <button

                            onClick={() =>
                                router.push(
                                    "/trip/1"
                                )
                            }

                            className="
        mt-6
        text-blue-500
        font-semibold
        text-right
        w-full
    "

                        >

                            상세보기 →

                        </button>

                    </div>

                </div>

            </div>

        </main>

    )


}
