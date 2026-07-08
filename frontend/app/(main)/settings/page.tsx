"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTrip } from "../../context/TripContext"
import api from "../../lib/api"
import { toast } from "react-hot-toast"

export default function SettingsPage() {
    const router = useRouter()
    const { user, setUser } = useTrip()

    const [nickname, setNickname] = useState(user?.nickname ?? "")
    const [currentPw, setCurrentPw] = useState("")
    const [newPw, setNewPw] = useState("")
    const [confirmPw, setConfirmPw] = useState("")
    const [nicknameSaving, setNicknameSaving] = useState(false)
    const [pwSaving, setPwSaving] = useState(false)

    const saveNickname = async () => {
        if (!nickname.trim()) {
            toast.error("닉네임을 입력해주세요.")
            return
        }
        setNicknameSaving(true)
        try {
            const res = await api.put("/me/nickname", { nickname: nickname.trim() })
            if (res.data.message) {
                toast.error("닉네임 변경에 실패했습니다.")
                return
            }
            setUser({ ...user, nickname: nickname.trim() })
            toast.success("닉네임이 변경되었습니다.")
        } catch {
            toast.error("오류가 발생했습니다.")
        } finally {
            setNicknameSaving(false)
        }
    }

    const savePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            toast.error("모든 항목을 입력해주세요.")
            return
        }
        if (newPw !== confirmPw) {
            toast.error("새 비밀번호가 일치하지 않습니다.")
            return
        }
        if (newPw.length < 6) {
            toast.error("비밀번호는 6자 이상이어야 합니다.")
            return
        }
        setPwSaving(true)
        try {
            const res = await api.put("/me/password", {
                current_password: currentPw,
                new_password: newPw,
            })
            if (res.data.message === "social login user") {
                toast.error("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.")
                return
            }
            if (res.data.message === "wrong password") {
                toast.error("현재 비밀번호가 올바르지 않습니다.")
                return
            }
            if (res.data.message) {
                toast.error("비밀번호 변경에 실패했습니다.")
                return
            }
            toast.success("비밀번호가 변경되었습니다.")
            setCurrentPw("")
            setNewPw("")
            setConfirmPw("")
        } catch {
            toast.error("오류가 발생했습니다.")
        } finally {
            setPwSaving(false)
        }
    }

    const handleLogout = async () => {
        await api.post("/logout")
        router.push("/login")
    }

    return (
        <main className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">설정</h1>

            <div className="space-y-6">

                {/* 프로필 */}
                <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-5">프로필</h2>

                    {/* 아바타 */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                            {user?.nickname?.[0] ?? "?"}
                        </div>
                        <div>
                            <p className="font-semibold">{user?.nickname}</p>
                            <p className="text-sm text-gray-400">{user?.email}</p>
                        </div>
                    </div>

                    {/* 닉네임 변경 */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">닉네임</label>
                        <div className="flex gap-2">
                            <input
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                                className="flex-1 border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                placeholder="닉네임 입력"
                            />
                            <button
                                onClick={saveNickname}
                                disabled={nicknameSaving}
                                className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                            >
                                {nicknameSaving ? "저장 중..." : "변경"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 비밀번호 변경 */}
                <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-5">비밀번호 변경</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">현재 비밀번호</label>
                            <input
                                type="password"
                                value={currentPw}
                                onChange={(e) => setCurrentPw(e.target.value)}
                                className="w-full border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                placeholder="현재 비밀번호"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                className="w-full border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                placeholder="새 비밀번호 (6자 이상)"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">새 비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPw}
                                onChange={(e) => setConfirmPw(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && savePassword()}
                                className="w-full border border-[#ECEEF2] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                placeholder="새 비밀번호 확인"
                            />
                        </div>
                        <button
                            onClick={savePassword}
                            disabled={pwSaving}
                            className="w-full mt-2 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 text-sm"
                        >
                            {pwSaving ? "변경 중..." : "비밀번호 변경"}
                        </button>
                    </div>
                </div>

                {/* 앱 정보 */}
                <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">앱 정보</h2>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>버전</span>
                            <span className="text-gray-400">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span>개발</span>
                            <span className="text-gray-400">TripPlan Team</span>
                        </div>
                    </div>
                </div>

                {/* 로그아웃 */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 border border-red-200 text-red-500 rounded-2xl font-semibold hover:bg-red-50 transition"
                >
                    로그아웃
                </button>

            </div>
        </main>
    )
}