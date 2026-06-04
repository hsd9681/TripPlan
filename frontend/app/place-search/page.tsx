"use client"

import { useState } from "react"
import axios from "axios"

export default function PlaceSearchPage() {

    const [query, setQuery] = useState("")
    const [places, setPlaces] = useState<any[]>([])

    const searchPlaces = async () => {

        try {

            const res = await axios.get(
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

    return (

        <main className="p-10">

            <h1 className="text-3xl font-bold mb-8">
                장소 검색
            </h1>

            <div className="flex gap-2 mb-6">

                <input
                    value={query}
                    onChange={(e) =>
                        setQuery(e.target.value)
                    }
                    placeholder="도쿄 스시"
                    className="border p-3 rounded w-96"
                />

                <button
                    onClick={searchPlaces}
                    className="bg-blue-500 text-white px-6 rounded"
                >
                    검색
                </button>

            </div>

            <div className="space-y-3">

                {
                    places.map((place) => (

                        <div
                            key={place.place_id}
                            className="border rounded p-4"
                        >

                            <h3 className="font-bold">
                                {place.name}
                            </h3>

                            <p>
                                {place.formatted_address}
                            </p>

                            <p>
                                ⭐ {place.rating}
                            </p>

                        </div>

                    ))
                }

            </div>

        </main>

    )
}