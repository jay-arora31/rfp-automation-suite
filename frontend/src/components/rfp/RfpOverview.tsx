import { Package, Shield, ScrollText, Truck, CreditCard, FileText, Send } from 'lucide-react'
import type { RfpWithVendors } from '@/services/rfpService'

interface RfpOverviewProps {
    rfp: RfpWithVendors
    onSendToVendors: () => void
}

export function RfpOverview({ rfp, onSendToVendors }: RfpOverviewProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Area */}
            {rfp.status === 'draft' && (
                <div className="bg-white p-6 rounded-xl border border-dashed border-[#635bff]/30 bg-[#635bff]/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-[#1a1f36] text-lg mb-1">Ready to launch?</h3>
                        <p className="text-slate-600 text-sm">
                            This RFP is currently in draft. Review the items below and send it to vendors to start receiving proposals.
                        </p>
                    </div>
                    <button
                        className="bg-[#635bff] hover:bg-[#544dc9] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
                        onClick={onSendToVendors}
                    >
                        <Send className="h-4 w-4" />
                        Send to Vendors
                    </button>
                </div>
            )}

            {/* Items Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#635bff] flex items-center justify-center shadow-lg shadow-[#635bff]/20">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Items Overview</h3>
                                <p className="text-xs text-slate-500">{rfp.items?.length || 0} items in this request</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-gradient-to-b from-slate-50/30 to-white">
                    {rfp.items && rfp.items.length > 0 ? (
                        <div className="space-y-3">
                            {rfp.items.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group bg-white rounded-xl border border-slate-200 hover:border-[#635bff]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    {/* Main Content Row */}
                                    <div className="p-4 flex items-center gap-4">
                                        {/* Index Badge */}
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 group-hover:bg-[#635bff]/10 group-hover:text-[#635bff] transition-colors">
                                            {idx + 1}
                                        </div>
                                        
                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-900 capitalize truncate">{item.name}</h4>
                                            </div>
                                            
                                            {/* Specs as inline tags */}
                                            {item.specifications && item.specifications.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {item.specifications.map((spec, sIdx) => (
                                                        <span 
                                                            key={sIdx} 
                                                            className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                                                        >
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side - Qty & Warranty */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* Warranty Badge */}
                                            {item.warranty && (
                                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100">
                                                    <Shield className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{item.warranty}</span>
                                                </div>
                                            )}
                                            
                                            {/* Quantity */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900">{item.quantity}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">units</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Warranty (shown on small screens) */}
                                    {item.warranty && (
                                        <div className="sm:hidden px-4 pb-3">
                                            <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100 w-fit">
                                                <Shield className="h-3.5 w-3.5" />
                                                <span className="font-medium">{item.warranty}</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Description (if exists) */}
                                    {item.description && (
                                        <div className="px-4 pb-4 pt-0">
                                            <p className="text-sm text-slate-500 pl-14 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h4 className="text-slate-700 font-semibold mb-1">No items yet</h4>
                            <p className="text-slate-500 text-sm">Items will appear here once added to this RFP</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Terms & Conditions Section */}
            {(rfp.deliveryDays || rfp.paymentTerms || rfp.warrantyTerms || rfp.additionalTerms) && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-[#635bff]" />
                            Terms & Conditions
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rfp.deliveryDays && (
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Truck className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery</span>
                                    </div>
                                    <p className="text-slate-800 font-medium pl-12">Within {rfp.deliveryDays} days</p>
                                </div>
                            )}

                            {rfp.paymentTerms && (
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Terms</span>
                                    </div>
                                    <p className="text-slate-800 font-medium pl-12">{rfp.paymentTerms}</p>
                                </div>
                            )}

                            {rfp.warrantyTerms && (
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warranty</span>
                                    </div>
                                    <p className="text-slate-800 font-medium pl-12">{rfp.warrantyTerms}</p>
                                </div>
                            )}

                            {rfp.additionalTerms && (
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Terms</span>
                                    </div>
                                    <p className="text-slate-800 font-medium pl-12">{rfp.additionalTerms}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

