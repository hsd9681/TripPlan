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

    openPanel: () => void

    closePanel: () => void

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

    const openPanel = () =>
        setIsOpen(true)

    const closePanel = () =>
        setIsOpen(false)

    return (

        <SearchPanelContext.Provider
            value={{
                isOpen,
                setIsOpen,
                openPanel,
                closePanel
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