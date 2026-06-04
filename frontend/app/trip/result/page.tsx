"use client"

import { useEffect, useState } from "react"

export default function TripResultPage() {

    const [tripInfo, setTripInfo] = useState<any>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [openDay, setOpenDay] = useState<number | null>(null)
    const [schedule, setSchedule] = useState<any>({})

    useEffect(() => {

    const tripData =
        localStorage.getItem("tripInfo")

    if (tripData) {
        setTripInfo(
            JSON.parse(tripData)
        )
    }

    const scheduleData =
        localStorage.getItem("schedule")

    if (scheduleData) {
        setSchedule(
            JSON.parse(scheduleData)
        )
    }

}, [])

    if (!tripInfo) {
        return (
            <main className="p-10">
                <h1>데이터 없음</h1>
            </main>
        )
    }

    return (

        <main className="p-10">

            <h1 className="text-3xl font-bold mb-8">
                여행 일정 결과
            </h1>

            <div className="border rounded-xl overflow-hidden">

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left p-6 bg-gray-100"
                >
                    <div className="flex justify-between items-center">

                        <h2 className="text-xl font-bold">
                            {tripInfo.city} 여행
                        </h2>

                        <span>
                            {isOpen ? "▼" : "▶"}
                        </span>

                    </div>
                </button>

                {isOpen && (

                    <div className="p-6">

                        <p>국가 : {tripInfo.country}</p>

                        <p>도시 : {tripInfo.city}</p>

                        <p>
                            기간 :
                            {tripInfo.startDate}
                            {" ~ "}
                            {tripInfo.endDate}
                        </p>

                        <p>
                            인원 :
                            {tripInfo.people}명
                        </p>

                        <div className="mt-6">

                            {
                                Array.from({
                                    length:
                                        Math.floor(
                                            (
                                                new Date(tripInfo.endDate).getTime()
                                                -
                                                new Date(tripInfo.startDate).getTime()
                                            )
                                            /
                                            (1000 * 60 * 60 * 24)
                                        ) + 1
                                }).map((_, index) => (

                                    <div
                                        key={index}
                                        className="border rounded-lg mb-3 overflow-hidden"
                                    >

                                        <button
                                            onClick={() =>
                                                setOpenDay(
                                                    openDay === index
                                                        ? null
                                                        : index
                                                )
                                            }
                                            className="
                    w-full
                    p-4
                    bg-gray-50
                    flex
                    justify-between
                "
                                        >

                                            <span>
                                                DAY {index + 1}
                                            </span>

                                            <span>
                                                {
                                                    openDay === index
                                                        ? "▼"
                                                        : "▶"
                                                }
                                            </span>

                                        </button>

                                        {
                                            openDay === index && (

                                                <div className="p-4 bg-white">

                                                    {
                                                        (schedule[index + 1] || []).map((place: string) => (

                                                            <div
                                                                key={place}
                                                                className="py-2"
                                                            >
                                                                {place}
                                                            </div>

                                                        ))
                                                    }

                                                </div>

                                            )
                                        }

                                    </div>

                                ))
                            }

                        </div>

                    </div>

                )}

            </div>

        </main>

    )
}