export interface Place {
    id: number
    trip_id: number
    day_number: number
    order_no: number
    place_id: string
    name: string
    category: string
    photo: string
    rating: number | null
    address: string
    duration: number
    lat: number | null   // ← null 허용으로 변경
    lng: number | null   // ← null 허용으로 변경
    memo: string | null
    cost: number
}

export interface Trip {
    id: number
    title: string
    country: string
    city: string
    start_date: string
    end_date: string
    people: number
    budget: number | null  // ← null 허용으로 변경
    created_at: string
    progress?: number
}

export interface User {
    id?: number            // ← optional로 변경
    email?: string         // ← optional로 변경
    nickname: string
}