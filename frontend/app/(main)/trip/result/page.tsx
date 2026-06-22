"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"

export default function TripResultPage() {

    const router = useRouter()

    const [trips, setTrips] =
        useState<any[]>([])

    useEffect(() => {

        api.get(

            "trip"
        )

            .then((res) => {
                console.log(res.data)

                setTrips(
                    res.data
                )

            })

    }, [])

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

                {trips.map(
                    (trip) => {

                        const tripDays =

                            Math.floor(

                                (

                                    new Date(
                                        trip.end_date
                                    ).getTime()

                                    -

                                    new Date(
                                        trip.start_date
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

                            <div

                                key={trip.id}

                                className="
                        bg-white
                        rounded-3xl
                        overflow-hidden
                        shadow-lg
                        cursor-pointer
                        hover:shadow-2xl
                        hover:-translate-y-1
                        transition-all
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

                                        {trip.title}

                                    </div>

                                    <div
                                        className="
                                text-gray-500
                                mt-2
                            "
                                    >

                                        {trip.start_date}

                                        {" ~ "}

                                        {trip.end_date}

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

                                    <button

                                        onClick={() =>
                                            router.push(
                                                `/trip/${trip.id}`
                                            )
                                        }

                                        className="
                                mt-6
                                text-blue-500
                                font-semibold
                                w-full
                                text-right
                            "

                                    >

                                        상세보기 →

                                    </button>

                                </div>

                            </div>

                        )

                    }
                )}

            </div>

        </main>

    )


}
