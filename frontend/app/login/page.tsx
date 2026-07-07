"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "../lib/api"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { SiKakaotalk } from "react-icons/si"
import { useTrip } from "../context/TripContext"

export default function LoginPage() {
    const router = useRouter()
    const { setUser, setCurrentTrip } = useTrip()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [keepLogin, setKeepLogin] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            toast.error("이메일과 비밀번호를 입력해주세요.")
            return
        }

        setLoading(true)
        try {
            const res = await api.post("login", { email, password })

            if (res.data.message === "user not found") {
                toast.error("존재하지 않는 계정입니다.")
                return
            }
            if (res.data.message === "wrong password") {
                toast.error("비밀번호가 올바르지 않습니다.")
                return
            }

            // 로그인 상태 유지 처리
            if (keepLogin) {
                localStorage.setItem("keep_login", "true")
            } else {
                localStorage.removeItem("keep_login")
            }

            setUser(res.data.user)

            // 최근 여행 로드
            try {
                const upcoming = await api.get("/trip/upcoming")
                setCurrentTrip(upcoming.data)
            } catch {
                setCurrentTrip(null)
            }

            toast.success("로그인 성공!")
            router.push("/")

        } catch {
            toast.error("로그인에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleLogin()
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-lg p-8">

                {/* 로고 */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">💙</div>
                    <h1 className="text-3xl font-bold text-blue-600">TripPlan AI</h1>
                    <p className="text-gray-400 text-sm mt-1">AI와 함께하는 스마트 여행 계획</p>
                </div>

                <h2 className="text-xl font-semibold mb-6">로그인</h2>

                <div className="flex flex-col gap-4">

                    {/* 이메일 */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">이메일</label>
                        <input
                            type="email"
                            placeholder="이메일을 입력하세요"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    {/* 로그인 상태 유지 */}
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={keepLogin}
                            onChange={(e) => setKeepLogin(e.target.checked)}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                        로그인 상태 유지
                    </label>

                    {/* 로그인 버튼 */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 mt-1"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                로그인 중...
                            </span>
                        ) : "로그인"}
                    </button>

                </div>

                {/* 소셜 로그인 */}
                <div className="relative my-7">
                    <div className="border-t border-[#ECEEF2]" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-xs text-gray-400">
                        소셜 계정으로 로그인
                    </span>
                </div>

                <div className="flex justify-center gap-4">
                    {/* 구글 */}
                    <button
                        onClick={() => { window.location.href =`${process.env.NEXT_PUBLIC_API_URL}/auth/google` }}
                        className="w-12 h-12 rounded-full border border-[#ECEEF2] flex items-center justify-center hover:bg-gray-50 transition"
                        title="구글로 로그인"
                    >
                        <FcGoogle size={24} />
                    </button>

                    {/* 카카오 */}
                    <button
                        onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao` }}
                        className="w-12 h-12 rounded-full bg-[#FEE500] flex items-center justify-center hover:bg-[#F6DC00] transition"
                        title="카카오로 로그인"
                    >
                        <SiKakaotalk size={22} color="#3C1E1E" />
                    </button>
                </div>

                {/* 회원가입 링크 */}
                <div className="text-center mt-7 text-sm text-gray-500">
                    계정이 없으신가요?
                    <Link href="/signup" className="ml-2 text-blue-500 font-semibold hover:underline">
                        회원가입
                    </Link>
                </div>

            </div>
        </main>
    )
}