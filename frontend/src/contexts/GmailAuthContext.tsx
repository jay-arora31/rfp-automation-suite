import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService } from '@/services/authService'

interface GmailAuthState {
    isConnected: boolean
    email: string | null
    isLoading: boolean
    error: string | null
}

interface GmailAuthContextType extends GmailAuthState {
    checkConnection: () => Promise<void>
    disconnect: () => Promise<void>
}

const GmailAuthContext = createContext<GmailAuthContextType | null>(null)

export function GmailAuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GmailAuthState>({
        isConnected: false,
        email: null,
        isLoading: true,
        error: null
    })

    const checkConnection = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))
            const status = await authService.getGmailStatus()
            setState({
                isConnected: status.connected,
                email: status.email || null,
                isLoading: false,
                error: null
            })
        } catch (error) {
            console.error('Failed to check Gmail status:', error)
            setState({
                isConnected: false,
                email: null,
                isLoading: false,
                error: 'Failed to check connection status'
            })
        }
    }, [])

    const disconnect = useCallback(async () => {
        try {
            await authService.disconnectGmail()
            setState({
                isConnected: false,
                email: null,
                isLoading: false,
                error: null
            })
        } catch (error) {
            console.error('Failed to disconnect Gmail:', error)
            throw error
        }
    }, [])

    // Check connection on mount
    useEffect(() => {
        checkConnection()
    }, [checkConnection])

    return (
        <GmailAuthContext.Provider value={{ ...state, checkConnection, disconnect }}>
            {children}
        </GmailAuthContext.Provider>
    )
}

export function useGmailAuth() {
    const context = useContext(GmailAuthContext)
    if (!context) {
        throw new Error('useGmailAuth must be used within a GmailAuthProvider')
    }
    return context
}

