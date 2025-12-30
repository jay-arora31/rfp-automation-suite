import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { rfpService } from '@/services/rfpService'
import type { Rfp } from '@/types/rfp'
import {
    Plus, Loader2, FileText, CheckCircle2, AlertCircle,
    Clock, Award, Mail, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react'
import styles from '@/styles/rfps.module.css'

const STATUS_CONFIG = {
    draft: { icon: FileText, label: 'Draft', class: styles.statusBadgeDraft },
    sent: { icon: Mail, label: 'Sent', class: styles.statusBadgeSent },
    evaluating: { icon: Clock, label: 'Evaluating', class: styles.statusBadgeEvaluating },
    awarded: { icon: Award, label: 'Awarded', class: styles.statusBadgeAwarded }
}

export function Rfps() {
    const navigate = useNavigate()
    // State
    const [rfps, setRfps] = useState<Rfp[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)


    const ITEMS_PER_PAGE = 10

    // Fetch RFPs
    const fetchRfps = useCallback(async () => {
        try {
            setLoading(true)
            const result = await rfpService.getRfps({
                page,
                limit: ITEMS_PER_PAGE,
                status: statusFilter || undefined
            })
            setRfps(result.rfps)
            setTotalPages(result.totalPages)
            setTotal(result.total)
        } catch (error) {
            console.error('Failed to fetch RFPs:', error)
            showNotification('error', 'Failed to load RFPs')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter])

    useEffect(() => {
        fetchRfps()
    }, [fetchRfps])

    // Notification helper
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 4000)
    }

    // Format currency
    const formatCurrency = (amount: number | null, currency = 'USD') => {
        if (!amount) return '—'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    // Get item count
    const getItemCount = (rfp: Rfp) => {
        return Array.isArray(rfp.items) ? rfp.items.length : 0
    }

    // Generate page numbers for pagination
    const pageNumbers = useMemo(() => {
        const pages: (number | 'ellipsis')[] = []
        const maxVisible = 5
        
        if (totalPages <= maxVisible + 2) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)
            
            if (page > 3) {
                pages.push('ellipsis')
            }
            
            // Show pages around current page
            const start = Math.max(2, page - 1)
            const end = Math.min(totalPages - 1, page + 1)
            
            for (let i = start; i <= end; i++) {
                pages.push(i)
            }
            
            if (page < totalPages - 2) {
                pages.push('ellipsis')
            }
            
            // Always show last page
            pages.push(totalPages)
        }
        
        return pages
    }, [page, totalPages])

    return (
        <div className={`${styles.container} p-6 lg:p-8 max-w-7xl mx-auto`}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>RFPs</h1>
                <Link to="/chat" className={styles.createBtn}>
                    <Plus className="w-4 h-4" />
                    Create RFP
                </Link>
            </div>

            {/* Status Tabs - Removed as requested */}
            <div style={{ marginBottom: '1.5rem' }}></div>

            {/* Notification */}
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

            {/* RFP Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <Loader2 className={styles.loadingSpinner} />
                        <span>Loading RFPs...</span>
                    </div>
                ) : rfps.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileText className={styles.emptyIcon} />
                        <h3>No RFPs found</h3>
                        <p>{statusFilter ? 'No RFPs with this status' : 'Create your first RFP using AI chat'}</p>
                        <Link to="/chat" className={styles.createBtn} style={{ marginTop: '1rem' }}>
                            <Plus className="w-4 h-4" />
                            Create RFP
                        </Link>
                    </div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Items</th>
                                    <th>Budget</th>
                                    <th>Created</th>
                                    <th>Proposals</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rfps.map(rfp => {
                                    const statusConfig = STATUS_CONFIG[rfp.status as keyof typeof STATUS_CONFIG]
                                    const StatusIcon = statusConfig?.icon || FileText
                                    return (
                                        <tr
                                            key={rfp.id}
                                            className={styles.row}
                                            onClick={() => navigate(`/rfps/${rfp.id}`)}
                                        >
                                            <td>
                                                <div className={styles.titleCell}>
                                                    <span className={styles.rfpTitle}>{rfp.title}</span>
                                                    {rfp.description && (
                                                        <span className={styles.rfpDescription}>{rfp.description}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${statusConfig?.class || ''}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig?.label || rfp.status}
                                                </span>
                                            </td>
                                            <td>{getItemCount(rfp)}</td>
                                            <td>{formatCurrency(rfp.budget, rfp.currency)}</td>
                                            <td>{formatDate(rfp.createdAt)}</td>
                                            <td>
                                                {rfp.proposalCount !== undefined && rfp.proposalCount > 0 ? (
                                                    <span className={styles.proposalCount}>{rfp.proposalCount}</span>
                                                ) : (
                                                    <span className={styles.noProposals}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/rfps/${rfp.id}`)
                                                    }}
                                                >
                                                    View <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <span className={styles.paginationInfo}>
                                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, total)} of {total} RFPs
                                </span>
                                <div className={styles.paginationControls}>
                                    {/* First Page */}
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        title="First Page"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    {/* Previous */}
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => p - 1)}
                                        disabled={page === 1}
                                        title="Previous Page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    {pageNumbers.map((pageNum, idx) => 
                                        pageNum === 'ellipsis' ? (
                                            <span key={`ellipsis-${idx}`} className={styles.paginationEllipsis}>...</span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                className={`${styles.paginationBtn} ${page === pageNum ? styles.paginationBtnActive : ''}`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    )}
                                    
                                    {/* Next */}
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page === totalPages}
                                        title="Next Page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    {/* Last Page */}
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(totalPages)}
                                        disabled={page === totalPages}
                                        title="Last Page"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    )
}
