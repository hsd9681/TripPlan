// app/page.tsx

import Link from "next/link"

export default function HomePage() {
    return (
        <main className="p-10">

            <h1 className="text-4xl font-bold mb-2">
                TripPlan AI
            </h1>

            <p className="text-gray-500 mb-10">
                여행 일정 생성 기능 테스트
            </p>

            {/* 현재 여행 */}
            <section className="mb-10">
                <div className="border rounded-xl p-6">

                    <h2 className="text-xl font-bold mb-2">
                        다가오는 여행
                    </h2>

                    <p>도쿄 4박 5일</p>

                    <p className="text-gray-500">
                        2025.07.20 ~ 2025.07.24
                    </p>

                </div>
            </section>

            {/* 기능 이동 */}
            <section>

                <h2 className="text-2xl font-bold mb-6">
                    기능 테스트
                </h2>

                <div className="grid grid-cols-2 gap-4">

                    <Link
                        href="/trip/create"
                        className="border rounded-xl p-6 hover:bg-gray-100"
                    >
                        <div className="text-3xl mb-2">
                            ✈️
                        </div>

                        <div className="font-bold">
                            여행 생성
                        </div>

                        <div className="text-sm text-gray-500">
                            국가 / 기간 입력
                        </div>
                    </Link>

                    <Link
                        href="/trip/result"
                        className="border rounded-xl p-6 hover:bg-gray-100"
                    >
                        <div className="text-3xl mb-2">
                            🍣
                        </div>

                        <div className="font-bold">
                            일정 결과
                        </div>

                        <div className="text-sm text-gray-500">
                            일정 결과
                        </div>
                    </Link>

                    <Link
                        href="/place-search"
                        className="border rounded-xl p-6 hover:bg-gray-100"
                    >
                        <div className="text-3xl mb-2">
                            ⭐
                        </div>

                        <div className="font-bold">
                            추천 장소
                        </div>

                        <div className="text-sm text-gray-500">
                            맛집 추천 리스트
                        </div>
                    </Link>

                    <Link
                        href="/map-test"
                        className="border rounded-xl p-6 hover:bg-gray-100"
                    >
                        <div className="text-3xl mb-2">
                            🗺️
                        </div>

                        <div className="font-bold">
                            지도 테스트
                        </div>

                        <div className="text-sm text-gray-500">
                            Google Maps + Route
                        </div>
                    </Link>

                </div>

            </section>

        </main>
    )
}