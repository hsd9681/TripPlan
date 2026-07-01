"use client"

import {
    createContext,
    useContext,
    useState
} from "react"
import api from "../lib/api"

const TripContext =
    createContext<any>(null)

export function TripProvider({
    children
}: {
    children: React.ReactNode
}) {

    const [
        selectedDay,
        setSelectedDay
    ] = useState<number | null>(
        null
    )

    const [
        scheduleMode,
        setScheduleMode
    ] = useState(false)

    const [
        schedule,
        setSchedule
    ] = useState<any>({})


    type User = {
    id: number
    nickname: string
    email: string
}

    const [user, setUser] = useState<User | null>(null)

    const [
        editingIndex,
        setEditingIndex
    ] = useState<number | null>(null)

    const [currentTrip, setCurrentTrip] =useState<any>(null)

    const refreshTrip = async () => {
    try {
        const res = await api.get("/trip/upcoming")
        setCurrentTrip(res.data)
    } catch {
        setCurrentTrip(null)
    }
}

    return (

        <TripContext.Provider

            value={{

                selectedDay,
                setSelectedDay,

                scheduleMode,
                setScheduleMode,

                schedule,
                setSchedule,

                editingIndex,
                setEditingIndex,

                user,
                setUser,

                currentTrip,
                setCurrentTrip,

                refreshTrip

            }}

        >

            {children}

        </TripContext.Provider>

    )

}

export function useTrip() {

    const context =
        useContext(
            TripContext
        )

    if (!context) {

        throw new Error(
            "useTrip must be used within TripProvider"
        )

    }

    return context

}