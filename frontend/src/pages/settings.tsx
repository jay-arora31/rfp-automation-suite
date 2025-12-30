import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import { useGmailAuth } from '@/contexts/GmailAuthContext'
import { Mail, CheckCircle2, XCircle, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import styles from '@/styles/settings.module.css'

export function Settings() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { isConnected, email, isLoading, checkConnection } = useGmailAuth()
    const [disconnecting, setDisconnecting] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Handle OAuth callback query params
    useEffect(() => {
        const gmailParam = searchParams.get('gmail')
        const emailParam = searchParams.get('email')
        const errorMessage = searchParams.get('message')

        if (gmailParam === 'connected' && emailParam) {
            setNotification({ type: 'success', message: `Gmail connected: ${emailParam}` })
            // Clear URL params
            setSearchParams({})
            // Refresh status
            checkConnection()
            // Redirect to dashboard after successful connection
            setTimeout(() => {
                navigate('/')
            }, 1500)
        } else if (gmailParam === 'error') {
            setNotification({ type: 'error', message: errorMessage || 'Failed to connect Gmail' })
            setSearchParams({})
        }
    }, [searchParams, setSearchParams, checkConnection, navigate])

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [notification])

    const handleConnect = () => {
        authService.connectGmail()
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Gmail account?')) return

        try {
            setDisconnecting(true)
            await authService.disconnectGmail()
            await checkConnection()
            setNotification({ type: 'success', message: 'Gmail disconnected successfully' })
        } catch (error) {
            console.error('Failed to disconnect Gmail:', error)
            setNotification({ type: 'error', message: 'Failed to disconnect Gmail' })
        } finally {
            setDisconnecting(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.description}>Manage your account preferences and integrations.</p>
            </div>

            {/* Connection Required Banner - Show only when not connected */}
            {!isLoading && !isConnected && (
                <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-900 mb-1">
                                Gmail Connection Required
                            </h3>
                            <p className="text-amber-700 mb-4">
                                To use the RFP Management System, you need to connect your Gmail account first. 
                                This allows the system to send RFPs to vendors and receive their proposals automatically.
                            </p>
                            <div className="flex items-center gap-3 text-sm text-amber-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Send RFPs via email</span>
                                <span className="text-amber-400">•</span>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Receive vendor proposals</span>
                                <span className="text-amber-400">•</span>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Automated follow-ups</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`${styles.notification} ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationError}`}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 className={styles.notificationIcon} />
                    ) : (
                        <AlertCircle className={styles.notificationIcon} />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Gmail Integration Card */}
            <Card className={styles.card}>
                <CardHeader>
                    <div className={styles.cardHeaderContent}>
                        <div className={`${styles.cardIcon} ${styles.gmailIcon}`}>
                            <Mail className={styles.icon} />
                        </div>
                        <div>
                            <CardTitle>Gmail Integration</CardTitle>
                            <CardDescription>
                                Connect your Gmail to send RFPs and receive vendor proposals via email.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={styles.gmailStatusSection}>
                        {isLoading ? (
                            <div className={styles.statusLoading}>
                                <Loader2 className={styles.spinner} />
                                <span>Checking connection status...</span>
                            </div>
                        ) : isConnected ? (
                            <div className={styles.statusConnected}>
                                <div className={styles.statusInfo}>
                                    <CheckCircle2 className={`${styles.statusIcon} ${styles.connected}`} />
                                    <div>
                                        <p className={styles.statusLabel}>Connected</p>
                                        <p className={styles.statusEmail}>{email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className={styles.disconnectBtn}
                                >
                                    {disconnecting ? (
                                        <>
                                            <Loader2 className={styles.spinnerSm} />
                                            Disconnecting...
                                        </>
                                    ) : (
                                        'Disconnect'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.statusDisconnected}>
                                <div className={styles.statusInfo}>
                                    <XCircle className={`${styles.statusIcon} ${styles.disconnected}`} />
                                    <div>
                                        <p className={styles.statusLabel}>Not Connected</p>
                                        <p className={styles.statusHint}>Connect Gmail to enable email features</p>
                                    </div>
                                </div>
                                <Button onClick={handleConnect} className={styles.connectBtn}>
                                    <Mail className={styles.btnIcon} />
                                    Connect Gmail
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
