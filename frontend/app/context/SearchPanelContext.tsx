"use client"

import {
    createContext,
    useContext,
    useState
} from "react"

type SearchPanelContextType = {
    isOpen: boolean
    setIsOpen: (
        value: boolean
    ) => void
}

const SearchPanelContext =
    createContext<
        SearchPanelContextType | undefined
    >(undefined)

export function SearchPanelProvider({
    children,
}: {
    children: React.ReactNode
}) {

    const [
        isOpen,
        setIsOpen
    ] = useState(false)

    return (

        <SearchPanelContext.Provider
            value={{
                isOpen,
                setIsOpen
            }}
        >

            {children}

        </SearchPanelContext.Provider>

    )
}

export function useSearchPanel() {

    const context =
        useContext(
            SearchPanelContext
        )

    if (!context) {

        throw new Error(
            "useSearchPanel error"
        )

    }

    return context
}