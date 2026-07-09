"use client"

import {
    createContext,
    useContext,
    useState
} from "react"
import api from "../lib/api"
import { Place, Trip as TripType, User } from "../types"

interface TripContextType {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    schedule: { [day: number]: Place[] }
    setSchedule: React.Dispatch<React.SetStateAction<{ [day: number]: Place[] }>>
    selectedDay: number | null
    setSelectedDay: React.Dispatch<React.SetStateAction<number | null>>
    scheduleMode: boolean
    setScheduleMode: React.Dispatch<React.SetStateAction<boolean>>
    editingIndex: number | null
    setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>
    currentTrip: TripType | null
    setCurrentTrip: React.Dispatch<React.SetStateAction<TripType | null>>
    refreshTrip: () => Promise<void>
}

const TripContext = createContext<TripContextType | null>(null)

export function TripProvider({ children }: { children: React.ReactNode }) {

    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [scheduleMode, setScheduleMode] = useState(false)
    const [schedule, setSchedule] = useState<{ [day: number]: Place[] }>({})
    const [user, setUser] = useState<User | null>(null)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [currentTrip, setCurrentTrip] = useState<TripType | null>(null)

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
    const context = useContext(TripContext)
    if (!context) {
        throw new Error("useTrip must be used within TripProvider")
    }
    return context
}