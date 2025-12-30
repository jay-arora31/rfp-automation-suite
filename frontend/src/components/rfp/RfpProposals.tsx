import { useState } from 'react'
import {
    FileText, Clock, Loader2, Trophy, RefreshCw, Target, Star,
    CheckCircle, TrendingUp, TrendingDown, AlertCircle, Award,
    ChevronDown, ChevronUp, Truck, CreditCard, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RfpWithVendors, SavedComparison, ComparisonStatus, VendorRanking } from '@/services/rfpService'

interface RfpProposalsProps {
    rfp: RfpWithVendors
    comparison: SavedComparison | null
    comparisonStatus: ComparisonStatus
    comparisonLoading: boolean
    awarding: boolean
    onTriggerComparison: () => void
    onAwardVendor: (vendorId: number) => void
}

export function RfpProposals({
    rfp,
    comparison,
    comparisonStatus,
    comparisonLoading,
    awarding,
    onTriggerComparison,
    onAwardVendor
}: RfpProposalsProps) {
    const [expandedProposals, setExpandedProposals] = useState<Set<number>>(new Set())
    const [expandedRankings, setExpandedRankings] = useState<Set<number>>(new Set([1]))

    const formatCurrency = (amount: number | null, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const toggleRanking = (rank: number) => {
        setExpandedRankings(prev => {
            const next = new Set(prev)
            if (next.has(rank)) {
                next.delete(rank)
            } else {
                next.add(rank)
            }
            return next
        })
    }

    const toggleProposal = (id: number) => {
        setExpandedProposals(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* COMPARISON SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Comparison Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#635bff] to-purple-600 flex items-center justify-center text-white">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">AI Comparison</h3>
                            <p className="text-slate-500 text-sm">
                                {comparison 
                                    ? `Last updated ${new Date(comparison.completedAt).toLocaleString()}`
                                    : comparisonStatus.status === 'pending' || comparisonStatus.status === 'processing'
                                        ? 'Analyzing proposals...'
                                        : 'Compare all proposals to find the best vendor'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {comparison && rfp.status !== 'awarded' && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={onTriggerComparison}
                                disabled={comparisonLoading || comparisonStatus.status === 'pending' || comparisonStatus.status === 'processing'}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${comparisonLoading ? 'animate-spin' : ''}`} />
                                Re-compare
                            </Button>
                        )}
                        {!comparison && comparisonStatus.status !== 'pending' && comparisonStatus.status !== 'processing' && rfp.status !== 'awarded' && (
                            <Button 
                                className="bg-[#635bff] hover:bg-[#544dc9] shadow-sm"
                                onClick={onTriggerComparison}
                                disabled={comparisonLoading || !rfp.proposals || rfp.proposals.length < 1}
                            >
                                {comparisonLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Trophy className="h-4 w-4 mr-2" />
                                )}
                                Compare All
                            </Button>
                        )}
                    </div>
                </div>

                {/* Comparison Loading State */}
                {(comparisonStatus.status === 'pending' || comparisonStatus.status === 'processing') && (
                    <div className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#635bff] mb-4" />
                        <p className="font-medium text-slate-900">Analyzing Proposals...</p>
                        <p className="text-sm text-slate-500 mt-1">AI is comparing all vendor proposals</p>
                    </div>
                )}

                {/* Comparison Results */}
                {comparison && comparison.comparison && (
                    <div className="p-6 space-y-6">
                        {/* AI Summary */}
                        {comparison.comparison.summary && (
                            <div className="bg-gradient-to-br from-[#635bff]/5 to-purple-500/5 rounded-lg border border-[#635bff]/20 p-4">
                                <div className="flex items-start gap-3">
                                    <Star className="h-5 w-5 text-[#635bff] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-slate-900 mb-1">AI Summary</h4>
                                        <p className="text-sm text-slate-600">{comparison.comparison.summary}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommendation */}
                        {comparison.comparison.recommendation && (
                            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-slate-900">Recommended:</h4>
                                            <span className="font-bold text-emerald-700">{comparison.comparison.recommendation.vendorName}</span>
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                {Math.round((comparison.comparison.recommendation.confidence || 0) * 100)}% confidence
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{comparison.comparison.recommendation.reason}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rankings */}
                        {comparison.comparison.rankings && comparison.comparison.rankings.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3">Vendor Rankings</h4>
                                <div className="space-y-3">
                                    {comparison.comparison.rankings.map((vendor: VendorRanking) => {
                                        const isExpanded = expandedRankings.has(vendor.rank)
                                        const isAwarded = rfp.awardedVendorId === vendor.vendorId
                                        return (
                                            <div 
                                                key={vendor.vendorId}
                                                className={`rounded-lg border transition-all ${
                                                    isAwarded
                                                        ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-200'
                                                        : vendor.rank === 1 
                                                            ? 'border-amber-300 bg-amber-50/50' 
                                                            : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                <div className="px-4 py-3 flex items-center gap-3">
                                                    {/* Rank Badge */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                        isAwarded ? 'bg-emerald-500 text-white' :
                                                        vendor.rank === 1 ? 'bg-amber-400 text-white' :
                                                        vendor.rank === 2 ? 'bg-slate-300 text-white' :
                                                        vendor.rank === 3 ? 'bg-amber-600 text-white' :
                                                        'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {isAwarded ? <CheckCircle className="h-4 w-4" /> : vendor.rank === 1 ? <Trophy className="h-4 w-4" /> : `#${vendor.rank}`}
                                                    </div>
                                                    
                                                    {/* Vendor Info */}
                                                    <button 
                                                        onClick={() => toggleRanking(vendor.rank)}
                                                        className="flex-1 min-w-0 text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900">{vendor.vendorName}</span>
                                                            {isAwarded ? (
                                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">✓ AWARDED</span>
                                                            ) : vendor.rank === 1 && (
                                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Best Match</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                                            <span>${Number(vendor.totalPrice).toLocaleString()}</span>
                                                            {vendor.deliveryDays && <span>• {vendor.deliveryDays} days</span>}
                                                            {vendor.warranty && <span>• {vendor.warranty}</span>}
                                                        </div>
                                                    </button>

                                                    {/* Score */}
                                                    <div className="text-right mr-2">
                                                        <div className={`text-lg font-bold ${
                                                            (vendor.score || 0) >= 0.8 ? 'text-emerald-600' :
                                                            (vendor.score || 0) >= 0.6 ? 'text-amber-600' : 'text-red-500'
                                                        }`}>
                                                            {Math.round((vendor.score || 0) * 100)}
                                                        </div>
                                                        <div className="text-xs text-slate-400">/ 100</div>
                                                    </div>

                                                    {/* Award Button or Expand Button */}
                                                    {rfp.status !== 'awarded' ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#635bff] hover:bg-[#544dc9] text-white"
                                                            onClick={() => onAwardVendor(vendor.vendorId)}
                                                            disabled={awarding}
                                                        >
                                                            {awarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4 mr-1" />}
                                                            Award
                                                        </Button>
                                                    ) : (
                                                        <button onClick={() => toggleRanking(vendor.rank)} className="p-1">
                                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                                        {vendor.reasoning && (
                                                            <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                                                <p className="text-sm text-slate-600">{vendor.reasoning}</p>
                                                            </div>
                                                        )}

                                                        {/* Pros & Cons */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                            {vendor.pros && vendor.pros.length > 0 && (
                                                                <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                                                                    <h5 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                                                                        <TrendingUp className="h-3 w-3" /> Strengths
                                                                    </h5>
                                                                    <ul className="space-y-1">
                                                                        {vendor.pros.map((pro, idx) => (
                                                                            <li key={idx} className="text-xs text-emerald-700 flex items-start gap-1">
                                                                                <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                                {pro}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {vendor.cons && vendor.cons.length > 0 && (
                                                                <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
                                                                    <h5 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
                                                                        <TrendingDown className="h-3 w-3" /> Concerns
                                                                    </h5>
                                                                    <ul className="space-y-1">
                                                                        {vendor.cons.map((con, idx) => (
                                                                            <li key={idx} className="text-xs text-red-700 flex items-start gap-1">
                                                                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                                {con}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Items Pricing */}
                                                        {vendor.items && vendor.items.length > 0 && (
                                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                                <table className="w-full text-xs">
                                                                    <thead className="bg-slate-50">
                                                                        <tr>
                                                                            <th className="text-left px-3 py-2 font-medium text-slate-600">Item</th>
                                                                            <th className="text-center px-3 py-2 font-medium text-slate-600">Qty</th>
                                                                            <th className="text-right px-3 py-2 font-medium text-slate-600">Unit</th>
                                                                            <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {vendor.items.map((item, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="px-3 py-2 text-slate-900">{item.name}</td>
                                                                                <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                                                                                <td className="px-3 py-2 text-right text-slate-600">${Number(item.unitPrice).toLocaleString()}</td>
                                                                                <td className="px-3 py-2 text-right font-medium text-slate-900">${Number(item.totalPrice).toLocaleString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No Comparison Yet */}
                {!comparison && comparisonStatus.status !== 'pending' && comparisonStatus.status !== 'processing' && (
                    <div className="p-8 text-center text-slate-500">
                        {rfp.proposals && rfp.proposals.length >= 1 ? (
                            <p className="text-sm">Click "Compare All" to analyze and rank all proposals</p>
                        ) : (
                            <p className="text-sm">Need at least 1 proposal to run comparison</p>
                        )}
                    </div>
                )}
            </div>

            {/* PROPOSALS LIST */}
            {rfp.proposals && rfp.proposals.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Received Proposals</h3>
                            <p className="text-slate-500 text-sm">
                                <span className="text-[#635bff] font-semibold">{rfp.proposals.length}</span>
                                <span className="text-slate-400">/</span>
                                <span>{rfp.vendors?.length || 0}</span>
                                {' '}responses received
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {rfp.proposals.map((proposal, idx) => {
                            const isExpanded = expandedProposals.has(proposal.id || idx)
                            
                            return (
                                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex gap-4">
                                            <div className="mt-1 h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">
                                                    {proposal.vendor?.name || `Vendor #${proposal.vendorId}`}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                    <span>Received {new Date(proposal.receivedAt).toLocaleDateString()}</span>
                                                    {proposal.items && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span>{proposal.items.length} items quoted</span>
                                                        </>
                                                    )}
                                                </div>
                                                {!isExpanded && proposal.items && proposal.items.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {proposal.items.slice(0, 3).map((pItem, pIdx) => (
                                                            <span key={pIdx} className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded">
                                                                {pItem.itemName} ({formatCurrency(Number(pItem.unitPrice))})
                                                            </span>
                                                        ))}
                                                        {proposal.items.length > 3 && (
                                                            <span className="text-xs text-slate-400">+{proposal.items.length - 3} more</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-center min-w-[150px]">
                                            <div className="text-2xl font-bold text-slate-900">
                                                {formatCurrency(Number(proposal.totalPrice), proposal.currency)}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Total Bid</p>

                                            <div className="mt-4 flex gap-2 w-full md:w-auto">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full"
                                                    onClick={() => toggleProposal(proposal.id || idx)}
                                                >
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                                            {proposal.items && proposal.items.length > 0 && (
                                                <div className="p-6 border-b border-slate-100">
                                                    <h5 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Quoted Items</h5>
                                                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                                <tr>
                                                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Item</th>
                                                                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Qty</th>
                                                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Unit Price</th>
                                                                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                                                                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Warranty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {proposal.items.map((pItem, pIdx) => (
                                                                    <tr key={pIdx} className="hover:bg-slate-50">
                                                                        <td className="px-4 py-3">
                                                                            <span className="font-medium text-slate-900">{pItem.itemName}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-slate-600">
                                                                            {pItem.quantity}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-slate-600">
                                                                            {formatCurrency(Number(pItem.unitPrice))}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                                                            {formatCurrency(Number(pItem.totalPrice))}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {pItem.warranty ? (
                                                                                <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                                                                    <Shield className="h-3 w-3" />
                                                                                    {pItem.warranty}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-400">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Grand Total</td>
                                                                    <td className="px-4 py-3 text-right font-bold text-[#635bff] text-lg">
                                                                        {formatCurrency(Number(proposal.totalPrice), proposal.currency)}
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Proposal Terms */}
                                            <div className="p-6">
                                                <h5 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Proposal Terms</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {proposal.deliveryDays && (
                                                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                                                <Truck className="h-4 w-4" />
                                                                <span className="text-xs font-semibold uppercase tracking-wide">Delivery</span>
                                                            </div>
                                                            <p className="text-slate-900 font-medium">{proposal.deliveryDays} days</p>
                                                        </div>
                                                    )}
                                                    {proposal.paymentTerms && (
                                                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                                                <CreditCard className="h-4 w-4" />
                                                                <span className="text-xs font-semibold uppercase tracking-wide">Payment</span>
                                                            </div>
                                                            <p className="text-slate-900 font-medium">{proposal.paymentTerms}</p>
                                                        </div>
                                                    )}
                                                    {proposal.warrantyTerms && (
                                                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                                                                <Shield className="h-4 w-4" />
                                                                <span className="text-xs font-semibold uppercase tracking-wide">Warranty</span>
                                                            </div>
                                                            <p className="text-slate-900 font-medium">{proposal.warrantyTerms}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {proposal.notes && (
                                                    <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="text-xs font-semibold uppercase tracking-wide">Vendor Notes</span>
                                                        </div>
                                                        <p className="text-slate-700 text-sm">{proposal.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No proposals yet</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        <span className="text-[#635bff] font-semibold">0</span>
                        <span className="text-slate-400">/</span>
                        <span>{rfp.vendors?.length || 0}</span>
                        {' '}responses received
                    </p>
                    <div className="inline-flex gap-2 text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg">
                        <Clock className="h-4 w-4" /> Waiting for {rfp.vendors?.filter(v => v.status === 'sent' || v.status === 'pending').length || 0} vendors to respond
                    </div>
                </div>
            )}
        </div>
    )
}

