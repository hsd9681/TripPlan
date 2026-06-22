"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "../lib/api"


import Link from "next/link"
import {
    FcGoogle
} from "react-icons/fc"

import {
    FaApple
} from "react-icons/fa"

import {
    SiNaver,
    SiKakaotalk
} from "react-icons/si"

export default function LoginPage() {

    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    return (

        <main
            className="
                min-h-screen
                bg-gray-100
                flex
                items-center
                justify-center
                px-4
            "
        >

            <div
                className="
                    bg-white
                    w-full
                    max-w-md
                    rounded-3xl
                    shadow-lg
                    p-8
                "
            >

                <div className="text-center mb-8">

                    <div className="text-5xl mb-4">
                        💙
                    </div>

                    <h1
                        className="
                            text-3xl
                            font-bold
                            text-blue-600
                        "
                    >
                        TripPlan AI
                    </h1>

                </div>

                <h2
                    className="
                        text-xl
                        font-semibold
                        mb-6
                    "
                >
                    로그인
                </h2>

                <div className="flex flex-col gap-4">

                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        className="
        border
        rounded-xl
        p-3
    "
                    />

                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        className="
        border
        rounded-xl
        p-3
    "
                    />

                    <label
                        className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-600
                        "
                    >
                        <input type="checkbox" />
                        로그인 상태 유지
                    </label>

                    <button

                        onClick={async () => {

                            try {

                                const res = api.post(

                                    "login",

                                    {

                                        email,

                                        password

                                    }

                                )

                                alert(
                                    "로그인 성공"
                                )

                                router.push("/")

                            }

                            catch (err) {

                                console.error(err)

                                alert(
                                    "로그인 실패"
                                )

                            }

                        }}

                        className="
        bg-blue-600
        text-white
        p-3
        rounded-xl
        font-semibold
    "
                    >

                        로그인

                    </button>

                </div>

                <div className="relative my-8">

                    <div className="border-t" />

                    <span
                        className="
                            absolute
                            left-1/2
                            -translate-x-1/2
                            -top-3
                            bg-white
                            px-4
                            text-sm
                            text-gray-500
                        "
                    >
                        소셜 계정으로 로그인
                    </span>

                </div>

                <div
                    className="
                        flex
                        justify-center
                        gap-4
                    "
                >

                    <button
                        className="
                            w-12
                            h-12
                            rounded-full
                            border
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <FcGoogle size={24} />
                    </button>

                    <button
                        className="
                            w-12
                            h-12
                            rounded-full
                            border
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <FaApple size={24} />
                    </button>

                    <button
                        className="
                            w-12
                            h-12
                            rounded-full
                            border
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <SiNaver size={24} />
                    </button>

                    <button
                        className="
                            w-12
                            h-12
                            rounded-full
                            border
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <SiKakaotalk size={24} />
                    </button>

                </div>

                <div
                    className="
                        text-center
                        mt-8
                        text-sm
                    "
                >

                    계정이 없으신가요?

                    <Link
                        href="/signup"
                        className="
                            ml-2
                            text-blue-600
                            font-semibold
                        "
                    >
                        회원가입
                    </Link>

                </div>

            </div>

        </main>

    )
}