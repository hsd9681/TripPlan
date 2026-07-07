"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "../../../lib/api"
import { useTrip } from "../../../context/TripContext"
import { toast } from "react-hot-toast"

function KakaoCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setUser, setCurrentTrip } = useTrip()

    useEffect(() => {
        const code = searchParams.get("code")

        if (!code) {
            toast.error("카카오 로그인에 실패했습니다.")
            router.push("/login")
            return
        }

        const handleKakaoLogin = async () => {
            try {
                const res = await api.post("/auth/kakao/token", { code })

                if (res.data.message) {
                    toast.error("카카오 로그인에 실패했습니다.")
                    router.push("/login")
                    return
                }

                document.cookie = `access_token=${res.data.access_token}; path=/; SameSite=Lax`
                setUser(res.data.user)

                try {
                    const upcoming = await api.get("/trip/upcoming")
                    setCurrentTrip(upcoming.data)
                } catch {
                    setCurrentTrip(null)
                }

                toast.success("카카오 로그인 성공!")
                router.push("/")
            } catch {
                toast.error("로그인에 실패했습니다.")
                router.push("/login")
            }
        }

        handleKakaoLogin()
    }, [])

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">카카오 로그인 처리 중...</p>
            </div>
        </main>
    )
}

export default function KakaoCallbackPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-yellow-100 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            </main>
        }>
            <KakaoCallbackContent />
        </Suspense>
    )
}