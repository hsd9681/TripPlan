"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "../lib/api"
import { toast } from "react-hot-toast"

export default function SignupPage() {
    const router = useRouter()

    const [nickname, setNickname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSignup = async () => {
        if (!nickname.trim() || !email.trim() || !password || !passwordConfirm) {
            toast.error("모든 항목을 입력해주세요.")
            return
        }
        if (password !== passwordConfirm) {
            toast.error("비밀번호가 일치하지 않습니다.")
            return
        }
        if (password.length < 6) {
            toast.error("비밀번호는 6자 이상이어야 합니다.")
            return
        }

        setLoading(true)
        try {
            const res = await api.post("signup", { email, password, nickname })

            if (res.data.message === "email exists") {
                toast.error("이미 사용 중인 이메일입니다.")
                return
            }

            toast.success("회원가입이 완료되었습니다!")
            router.push("/login")
        } catch {
            toast.error("회원가입에 실패했습니다.")
        } finally {
            setLoading(false)
        }
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

                <h2 className="text-xl font-semibold mb-6">회원가입</h2>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">닉네임</label>
                        <input
                            placeholder="닉네임을 입력하세요"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">이메일</label>
                        <input
                            type="email"
                            placeholder="이메일을 입력하세요"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호 (6자 이상)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호 확인</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                            className="w-full border border-[#ECEEF2] rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm"
                        />
                    </div>

                    <button
                        onClick={handleSignup}
                        disabled={loading}
                        className="bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 mt-1"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                가입 중...
                            </span>
                        ) : "회원가입"}
                    </button>
                </div>

                <div className="text-center mt-7 text-sm text-gray-500">
                    이미 계정이 있으신가요?
                    <Link href="/login" className="ml-2 text-blue-500 font-semibold hover:underline">
                        로그인
                    </Link>
                </div>

            </div>
        </main>
    )
}