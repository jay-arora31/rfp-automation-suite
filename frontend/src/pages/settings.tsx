import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import type { GmailStatus } from '@/types/auth'
import { Mail, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import styles from '@/styles/settings.module.css'

export function Settings() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [disconnecting, setDisconnecting] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Fetch Gmail status on mount
    useEffect(() => {
        fetchGmailStatus()
    }, [])

    // Handle OAuth callback query params
    useEffect(() => {
        const gmailParam = searchParams.get('gmail')
        const email = searchParams.get('email')
        const errorMessage = searchParams.get('message')

        if (gmailParam === 'connected' && email) {
            setNotification({ type: 'success', message: `Gmail connected: ${email}` })
            // Clear URL params
            setSearchParams({})
            // Refresh status
            fetchGmailStatus()
        } else if (gmailParam === 'error') {
            setNotification({ type: 'error', message: errorMessage || 'Failed to connect Gmail' })
            setSearchParams({})
        }
    }, [searchParams, setSearchParams])

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [notification])

    const fetchGmailStatus = async () => {
        try {
            setLoading(true)
            const status = await authService.getGmailStatus()
            setGmailStatus(status)
        } catch (error) {
            console.error('Failed to fetch Gmail status:', error)
            setGmailStatus({ connected: false })
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = () => {
        authService.connectGmail()
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Gmail account?')) return

        try {
            setDisconnecting(true)
            await authService.disconnectGmail()
            setGmailStatus({ connected: false })
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
                        {loading ? (
                            <div className={styles.statusLoading}>
                                <Loader2 className={styles.spinner} />
                                <span>Checking connection status...</span>
                            </div>
                        ) : gmailStatus?.connected ? (
                            <div className={styles.statusConnected}>
                                <div className={styles.statusInfo}>
                                    <CheckCircle2 className={`${styles.statusIcon} ${styles.connected}`} />
                                    <div>
                                        <p className={styles.statusLabel}>Connected</p>
                                        <p className={styles.statusEmail}>{gmailStatus.email}</p>
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
