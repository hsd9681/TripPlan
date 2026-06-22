"use client"

import Link from "next/link"
import api from "../lib/api"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {


    const router = useRouter()

    const [nickname, setNickname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")

    return (

        <main className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-10 rounded-2xl shadow w-full max-w-md">

                <h1 className="text-3xl font-bold text-center mb-8">
                    회원가입
                </h1>

                <div className="flex flex-col gap-4">

                    <input
                        placeholder="이름"
                        value={nickname}
                        onChange={(e) =>
                            setNickname(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded"
                    />

                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded"
                    />

                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded"
                    />

                    <input
                        type="password"
                        placeholder="비밀번호 확인"
                        value={passwordConfirm}
                        onChange={(e) =>
                            setPasswordConfirm(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded"
                    />

                    <button

                        onClick={async () => {

                            if (
                                password !==
                                passwordConfirm
                            ) {

                                alert(
                                    "비밀번호가 다릅니다."
                                )

                                return
                            }

                            try {

                                const res =
                                    await api.post(

                                        "signup",

                                        {

                                            email,

                                            password,

                                            nickname

                                        }

                                    )

                                alert(
                                    "회원가입 완료"
                                )

                                router.push(
                                    "/login"
                                )

                            } catch {

                                alert(
                                    "회원가입 실패"
                                )

                            }

                        }}

                        className="
        bg-blue-500
        text-white
        p-3
        rounded
    "
                    >
                        회원가입
                    </button>

                </div>

                <div className="mt-6 text-center">

                    <Link
                        href="/login"
                        className="text-blue-500"
                    >
                        로그인으로 이동
                    </Link>

                </div>

            </div>

        </main>

    )
}