"use client"

import Link from "next/link"

import SearchPanel from "../components/SearchPanel"
import api from "../lib/api"
import { useRouter } from "next/navigation"
import { useTrip } from "../context/TripContext"



import {
  useSearchPanel,
} from "../context/SearchPanelContext"
import { useEffect } from "react"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const {
    isOpen,
    setIsOpen
  } = useSearchPanel()

  const router = useRouter()
  const { user, setUser } = useTrip()

  useEffect(() => {

    const loadUser = async () => {

      try {

        const res = await api.get("/me")

        setUser(res.data)

      } catch {

        router.push("/login")

      }

    }

    loadUser()

  }, [])

  return (

    <div className="h-screen flex bg-[#f8fafc]">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">

        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b">

          <h1 className="text-3xl font-bold text-blue-600">
            TripPlan
          </h1>

        </div>

        {/* Menu */}
        <nav className="flex-1 p-3">

          <div className="space-y-2">

            <Link
              href="/"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                bg-blue-50
                text-blue-600
                font-medium
              "
            >
              🏠 홈
            </Link>

            <Link
              href="/trip/create"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
              "
            >
              ✈️ 내 여행
            </Link>

            {/* 지도 검색 토글 */}
            <button

              onClick={() =>
                setIsOpen(!isOpen)
              }

              className="
                w-full
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
                text-left
              "
            >

              🗺️ 지도 검색

            </button>

            <Link
              href="/trip/result"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
              "
            >
              ⭐ 추천 장소
            </Link>

            <Link
              href="#"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
              "
            >
              ❤️ 찜 목록
            </Link>

            <Link
              href="#"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
              "
            >
              📅 여행 관리
            </Link>

            <Link
              href="#"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                hover:bg-gray-100
              "
            >
              ⚙️ 설정
            </Link>

          </div>

        </nav>

        {/* Profile */}
        <div className="border-t p-4">

          <div className="flex items-center gap-3">

            <div
              className="
                w-10 h-10
                rounded-full
                bg-gray-300
              "
            />
            <div className="flex-1">
              <div className="flex items-center gap-12">

                <p className="font-medium">
                  {user?.nickname || "로딩중..."}
                </p>
                <button

                  onClick={async () => {

                    await api.post(
                      "/logout"
                    )

                    router.push(
                      "/login"
                    )

                  }}

                  className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer" >

                  로그아웃

                </button>
              </div>
              <p className="text-sm text-blue-500">
                Pro B1
              </p>


            </div>
          </div>

        </div>

      </aside>

      {/* Content */}
      <main
        className="
          flex-1
          overflow-auto
          transition-all
          duration-300
        "
      >
        {children}
      </main>

      {/* 전역 지도 패널 */}
      <SearchPanel />

    </div>

  );
}