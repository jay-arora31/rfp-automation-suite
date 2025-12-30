import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { rfpService, type RfpWithVendors, type SavedComparison, type ComparisonStatus } from '@/services/rfpService'
import { vendorService } from '@/services/vendorService'
import type { Vendor } from '@/types/vendor'
import { ArrowLeft, Calendar, DollarSign, Package, Loader2, AlertCircle } from 'lucide-react'
import { RfpTimeline, RfpOverview, RfpVendorList, RfpProposals, SendRfpDialog } from '@/components/rfp'

export function RfpDetail() {
    const { id } = useParams()
    const [rfp, setRfp] = useState<RfpWithVendors | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'proposals'>('overview')
    const [tabInitialized, setTabInitialized] = useState(false)
    
    // Award state
    const [awarding, setAwarding] = useState(false)

    // Comparison state
    const [comparison, setComparison] = useState<SavedComparison | null>(null)
    const [comparisonStatus, setComparisonStatus] = useState<ComparisonStatus>({ status: 'none' })
    const [comparisonLoading, setComparisonLoading] = useState(false)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Send Dialog State
    const [sending, setSending] = useState(false)
    const [sendDialogOpen, setSendDialogOpen] = useState(false)
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [selectedVendors, setSelectedVendors] = useState<number[]>([])

    useEffect(() => {
        if (id) {
            fetchRfp(parseInt(id))
        }
    }, [id])

    // Set default tab based on RFP status
    useEffect(() => {
        if (rfp && !tabInitialized) {
            if (['sent', 'evaluating', 'awarded'].includes(rfp.status)) {
                setActiveTab('proposals')
            }
            setTabInitialized(true)
        }
    }, [rfp, tabInitialized])

    const fetchRfp = async (rfpId: number) => {
        try {
            setLoading(true)
            const data = await rfpService.getRfpById(rfpId)
            setRfp(data)
        } catch (err) {
            console.error('Error fetching RFP:', err)
            setError('Failed to load RFP details')
        } finally {
            setLoading(false)
        }
    }

    const fetchVendors = async () => {
        try {
            const result = await vendorService.getVendors({ limit: 100 })
            setVendors(result.vendors)
        } catch (err) {
            console.error('Error loading vendors:', err)
        }
    }

    // Fetch saved comparison
    const fetchComparison = useCallback(async (rfpId: number) => {
        try {
            const saved = await rfpService.getComparison(rfpId)
            if (saved) {
                setComparison(saved)
                setComparisonStatus({ status: 'completed', completedAt: saved.completedAt })
            } else {
                const status = await rfpService.getComparisonStatus(rfpId)
                setComparisonStatus(status)
                if (status.status === 'pending' || status.status === 'processing') {
                    startPolling(rfpId)
                }
            }
        } catch (err) {
            console.error('Error fetching comparison:', err)
        }
    }, [])

    // Start polling for comparison status
    const startPolling = useCallback((rfpId: number) => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
        }

        pollingRef.current = setInterval(async () => {
            try {
                const status = await rfpService.getComparisonStatus(rfpId)
                setComparisonStatus(status)

                if (status.status === 'completed') {
                    const saved = await rfpService.getComparison(rfpId)
                    if (saved) {
                        setComparison(saved)
                    }
                    stopPolling()
                } else if (status.status === 'failed' || status.status === 'none') {
                    stopPolling()
                }
            } catch (err) {
                console.error('Error polling comparison status:', err)
                stopPolling()
            }
        }, 2000)
    }, [])

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }, [])

    // Trigger new comparison
    const triggerComparison = async () => {
        if (!rfp) return
        try {
            setComparisonLoading(true)
            setComparison(null)
            const result = await rfpService.triggerComparison(rfp.id)
            setComparisonStatus({ status: result.status as ComparisonStatus['status'] })
            if (result.status === 'pending' || result.status === 'processing') {
                startPolling(rfp.id)
            }
        } catch (err) {
            console.error('Error triggering comparison:', err)
        } finally {
            setComparisonLoading(false)
        }
    }

    // Award vendor
    const awardVendor = async (vendorId: number) => {
        if (!rfp) return
        try {
            setAwarding(true)
            await rfpService.awardVendor(rfp.id, vendorId)
            fetchRfp(rfp.id)
        } catch (err) {
            console.error('Error awarding vendor:', err)
        } finally {
            setAwarding(false)
        }
    }

    // Fetch comparison when switching to proposals tab
    useEffect(() => {
        if (activeTab === 'proposals' && rfp && !comparison && comparisonStatus.status === 'none') {
            fetchComparison(rfp.id)
        }
    }, [activeTab, rfp, comparison, comparisonStatus.status, fetchComparison])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => stopPolling()
    }, [stopPolling])

    const openSendDialog = () => {
        setSendDialogOpen(true)
        fetchVendors()
    }

    const handleSend = async () => {
        if (!rfp || selectedVendors.length === 0) return
        try {
            setSending(true)
            await rfpService.sendToVendors(rfp.id, selectedVendors)
            setSendDialogOpen(false)
            fetchRfp(rfp.id)
        } catch (err) {
            console.error('Error sending RFP:', err)
        } finally {
            setSending(false)
        }
    }

    const formatCurrency = (amount: number | null, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (error || !rfp) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold">RFP Not Found</h3>
            <p className="text-muted-foreground mb-4">{error || "The requested RFP doesn't exist"}</p>
            <Link to="/rfps" className="text-primary hover:underline">Return to RFPs list</Link>
        </div>
    )

    const hasComparison = comparison !== null && comparisonStatus.status === 'completed'

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                    <Link to="/rfps" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#635bff] transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to RFPs
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{rfp.title}</h1>
                                <span className={`
                                    px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                                    ${rfp.status === 'draft' ? 'bg-slate-100 text-slate-600' : ''}
                                    ${rfp.status === 'sent' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${rfp.status === 'evaluating' ? 'bg-amber-100 text-amber-700' : ''}
                                    ${rfp.status === 'awarded' ? 'bg-emerald-100 text-emerald-700' : ''}
                                `}>
                                    {rfp.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    Created {new Date(rfp.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4 text-slate-400" />
                                    Budget: <span className="font-semibold text-slate-700">{formatCurrency(rfp.budget, rfp.currency)}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Package className="h-4 w-4 text-slate-400" />
                                    <span className="font-semibold text-slate-700">{rfp.items?.length || 0}</span> Items
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <RfpTimeline status={rfp.status} hasComparison={hasComparison} />

            {/* Content Container */}
            <div className="max-w-7xl mx-auto w-full space-y-6 px-6 lg:px-8 pb-12 pt-8">
                {/* Tabs Header */}
                <div className="border-b border-slate-200">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`
                                pb-4 text-sm font-medium transition-colors relative
                                ${activeTab === 'overview'
                                    ? 'text-[#635bff] border-b-2 border-[#635bff]'
                                    : 'text-slate-500 hover:text-slate-700'
                                }
                            `}
                        >
                            Overview
                        </button>

                        {['sent', 'evaluating', 'awarded'].includes(rfp.status) && (
                            <button
                                onClick={() => setActiveTab('vendors')}
                                className={`
                                    pb-4 text-sm font-medium transition-colors relative
                                    ${activeTab === 'vendors'
                                        ? 'text-[#635bff] border-b-2 border-[#635bff]'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }
                                `}
                            >
                                Invited Vendors
                                {rfp.vendors && rfp.vendors.length > 0 && (
                                    <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                                        {rfp.vendors.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {['sent', 'evaluating', 'awarded'].includes(rfp.status) && (
                            <button
                                onClick={() => setActiveTab('proposals')}
                                className={`
                                    pb-4 text-sm font-medium transition-colors relative
                                    ${activeTab === 'proposals'
                                        ? 'text-[#635bff] border-b-2 border-[#635bff]'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }
                                `}
                            >
                                Proposals
                                {rfp.proposalCount && rfp.proposalCount > 0 ? (
                                    <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                                        {rfp.proposalCount}
                                    </span>
                                ) : null}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && (
                        <RfpOverview rfp={rfp} onSendToVendors={openSendDialog} />
                    )}

                    {activeTab === 'vendors' && (
                        <RfpVendorList rfp={rfp} onManageInvites={openSendDialog} />
                    )}

                    {activeTab === 'proposals' && (
                        <RfpProposals
                            rfp={rfp}
                            comparison={comparison}
                            comparisonStatus={comparisonStatus}
                            comparisonLoading={comparisonLoading}
                            awarding={awarding}
                            onTriggerComparison={triggerComparison}
                            onAwardVendor={awardVendor}
                        />
                    )}
                </div>
            </div>

            {/* Send Dialog */}
            <SendRfpDialog
                open={sendDialogOpen}
                vendors={vendors}
                selectedVendors={selectedVendors}
                sending={sending}
                onClose={() => setSendDialogOpen(false)}
                onSend={handleSend}
                onSelectionChange={setSelectedVendors}
            />
        </div>
    )
}
