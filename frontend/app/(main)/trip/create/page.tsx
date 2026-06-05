"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TripCreatePage() {
    const router = useRouter()

    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [people, setPeople] = useState(1)

    return (

        <main className="p-10">

            <h1 className="text-3xl font-bold mb-8">
                여행 생성
            </h1>

            <div className="flex flex-col gap-4 max-w-md">

                <input
                    placeholder="국가"
                    value={country}
                    onChange={(e) =>
                        setCountry(e.target.value)
                    }
                    className="border p-3 rounded"
                />

                <input
                    placeholder="도시"
                    value={city}
                    onChange={(e) =>
                        setCity(e.target.value)
                    }
                    className="border p-3 rounded"
                />

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                        setStartDate(e.target.value)
                    }
                    className="border p-3 rounded"
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                        setEndDate(e.target.value)
                    }
                    className="border p-3 rounded"
                />

                <input
                    type="number"
                    value={people}
                    onChange={(e) =>
                        setPeople(Number(e.target.value))
                    }
                    className="border p-3 rounded"
                />

                <button
                    onClick={() => {

                        localStorage.setItem(
                            "tripInfo",
                            JSON.stringify({
                                country,
                                city,
                                startDate,
                                endDate,
                                people
                            })
                        )

                        router.push("/trip/result")
                    }}
                    className="bg-blue-500 text-white p-3 rounded"
                >
                    입력값 확인
                </button>

            </div>

        </main>

    )
}