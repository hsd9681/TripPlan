"use client"

import Link from "next/link"

export default function SignupPage() {

    return (

        <main className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-10 rounded-2xl shadow w-full max-w-md">

                <h1 className="text-3xl font-bold text-center mb-8">
                    회원가입
                </h1>

                <div className="flex flex-col gap-4">

                    <input
                        placeholder="이름"
                        className="border p-3 rounded"
                    />

                    <input
                        type="email"
                        placeholder="이메일"
                        className="border p-3 rounded"
                    />

                    <input
                        type="password"
                        placeholder="비밀번호"
                        className="border p-3 rounded"
                    />

                    <input
                        type="password"
                        placeholder="비밀번호 확인"
                        className="border p-3 rounded"
                    />

                    <button
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