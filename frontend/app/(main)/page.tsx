"use client"

import Link from "next/link"
import { useTrip } from "../context/TripContext"

export default function HomePage() {
    const { user } = useTrip()



    return (

        <main className="p-8">

            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">

                    <div>

                        <h1 className="text-3xl font-bold">
                            안녕하세요, {user?.nickname || "여행자"}님 👋
                        </h1>

                        <p className="text-gray-500 mt-1">
                            다가오는 여행
                        </p>

                    </div>

                    <div className="flex gap-6 text-xl">

                        <button>
                            🔔
                        </button>

                        <button>
                            👤
                        </button>

                    </div>

                </div>

                {/* Trip Card */}
                <div
                    className="
                        bg-blue-50
                        rounded-3xl
                        p-6
                        mb-8
                    "
                >

                    <div className="flex justify-between">

                        <div>

                            <h2 className="font-bold text-2xl">
                                도쿄 4박 5일
                            </h2>

                            <p className="text-gray-500 mt-1">
                                2025.07.20 ~ 2025.07.24
                            </p>

                        </div>

                        <div
                            className="
                                bg-white
                                text-blue-600
                                font-bold
                                px-4 py-2
                                rounded-full
                                h-fit
                            "
                        >
                            D-8
                        </div>

                    </div>

                    <div className="mt-6">

                        <div
                            className="
                                h-2
                                bg-gray-200
                                rounded-full
                            "
                        >

                            <div
                                className="
                                    h-2
                                    w-3/4
                                    bg-blue-500
                                    rounded-full
                                "
                            />

                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                            일정 준비도 75%
                        </p>

                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">

                        <Link
                            href="/trip/result"
                            className="
                                bg-white
                                text-center
                                py-3
                                rounded-xl
                                font-medium
                            "
                        >
                            일정 보기
                        </Link>

                        <Link
                            href="/trip/create"
                            className="
                                bg-white
                                text-center
                                py-3
                                rounded-xl
                                font-medium
                            "
                        >
                            일정 수정
                        </Link>

                    </div>

                </div>

                {/* Quick Menu */}
                <div
                    className="
                        grid
                        grid-cols-4
                        gap-5
                        mb-10
                    "
                >

                    <Link
                        href="/trip/create"
                        className="
                            bg-white
                            rounded-2xl
                            shadow-sm
                            p-6
                            text-center
                            hover:shadow-md
                        "
                    >
                        <div className="text-3xl mb-3">
                            ✈️
                        </div>

                        <p className="font-medium">
                            새 여행 계획
                        </p>
                    </Link>

                    <Link
                        href="/place-search"
                        className="
                            bg-white
                            rounded-2xl
                            shadow-sm
                            p-6
                            text-center
                            hover:shadow-md
                        "
                    >
                        <div className="text-3xl mb-3">
                            🔍
                        </div>

                        <p className="font-medium">
                            지도 검색
                        </p>
                    </Link>

                    <Link
                        href="/trip/result"
                        className="
                            bg-white
                            rounded-2xl
                            shadow-sm
                            p-6
                            text-center
                            hover:shadow-md
                        "
                    >
                        <div className="text-3xl mb-3">
                            ⭐
                        </div>

                        <p className="font-medium">
                            추천 코스
                        </p>
                    </Link>

                    <Link
                        href="/trip/result"
                        className="
                            bg-white
                            rounded-2xl
                            shadow-sm
                            p-6
                            text-center
                            hover:shadow-md
                        "
                    >
                        <div className="text-3xl mb-3">
                            📝
                        </div>

                        <p className="font-medium">
                            여행 기록
                        </p>
                    </Link>

                </div>

                {/* Recommendation */}
                <section>

                    <h2 className="text-xl font-bold mb-4">
                        맞춤 추천
                    </h2>

                    <div className="grid grid-cols-3 gap-5">

                        {[
                            "도쿄 야경 TOP 5",
                            "도쿄 맛집 투어",
                            "벚꽃 명소 베스트",
                        ].map((title) => (

                            <div
                                key={title}
                                className="
                                    bg-white
                                    rounded-2xl
                                    overflow-hidden
                                    shadow-sm
                                "
                            >

                                <div
                                    className="
                                        h-32
                                        bg-gradient-to-r
                                        from-blue-200
                                        to-purple-200
                                    "
                                />

                                <div className="p-4">

                                    <p className="font-bold">
                                        {title}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                </section>

            </div>

        </main>

    )
}