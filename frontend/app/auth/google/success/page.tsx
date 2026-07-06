"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../../lib/api"
import { useTrip } from "../../../context/TripContext"
import { toast } from "react-hot-toast"

export default function GoogleSuccessPage() {
    const router = useRouter()
    const { setUser, setCurrentTrip } = useTrip()

    useEffect(() => {
        const loadUser = async () => {
            try {
                const me = await api.get("/me")
                setUser(me.data)

                try {
                    const upcoming = await api.get("/trip/upcoming")
                    setCurrentTrip(upcoming.data)
                } catch {
                    setCurrentTrip(null)
                }

                toast.success("구글 로그인 성공!")
                router.push("/")
            } catch {
                toast.error("로그인에 실패했습니다.")
                router.push("/login")
            }
        }

        loadUser()
    }, [])

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">구글 로그인 처리 중...</p>
            </div>
        </main>
    )
}