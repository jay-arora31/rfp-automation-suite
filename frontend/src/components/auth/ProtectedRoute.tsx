import { Navigate } from 'react-router-dom'
import { useGmailAuth } from '@/contexts/GmailAuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isConnected, isLoading } = useGmailAuth()

    // Show loading spinner while checking connection
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#635bff]" />
                    <p className="text-sm text-muted-foreground">Checking connection...</p>
                </div>
            </div>
        )
    }

    // Redirect to settings if not connected
    if (!isConnected) {
        return <Navigate to="/settings" replace />
    }

    // Render children if connected
    return <>{children}</>
}

