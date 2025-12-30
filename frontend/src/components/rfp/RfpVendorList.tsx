import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RfpWithVendors } from '@/services/rfpService'
import styles from '@/styles/rfp-detail.module.css'

interface RfpVendorListProps {
    rfp: RfpWithVendors
    onManageInvites: () => void
}

export function RfpVendorList({ rfp, onManageInvites }: RfpVendorListProps) {
    const statusLabels: Record<string, string> = {
        pending: 'Pending',
        sent: 'Sent',
        awaiting_details: 'Awaiting Details',
        responded: 'Responded',
        declined: 'Declined',
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return styles.vendorStatusPending
            case 'sent': return styles.vendorStatusSent
            case 'awaiting_details': return styles.vendorStatusAwaitingDetails
            case 'responded': return styles.vendorStatusResponded
            case 'declined': return styles.vendorStatusDeclined
            default: return ''
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Invited Vendors</h3>
                {rfp.status === 'draft' && (
                    <Button variant="outline" onClick={onManageInvites} className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Manage Invites
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {rfp.vendors && rfp.vendors.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {rfp.vendors.map(vendor => {
                            const displayStatus = statusLabels[vendor.status] || vendor.status

                            return (
                                <div key={vendor.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                                                {vendor.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{vendor.name}</div>
                                                <div className="text-sm text-slate-500">{vendor.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {vendor.sentAt && (
                                                <div className="text-xs text-slate-400">
                                                    Sent {new Date(vendor.sentAt).toLocaleDateString()}
                                                </div>
                                            )}
                                            <span className={`${styles.vendorStatus} ${getStatusClass(vendor.status)} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
                                                {displayStatus}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Follow-up info for awaiting_details status */}
                                    {vendor.status === 'awaiting_details' && (
                                        <div className="mt-3 ml-14 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                            <div className="text-xs text-amber-700">
                                                <span className="font-semibold">Follow-up sent</span>
                                                {vendor.followUpCount && (
                                                    <span className="ml-1">({vendor.followUpCount}x)</span>
                                                )}
                                                {vendor.missingFields && vendor.missingFields.length > 0 && (
                                                    <span className="ml-2">
                                                        — Missing: {(vendor.missingFields as string[]).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Users className="h-8 w-8" />
                        </div>
                        <h3 className="text-slate-900 font-medium mb-1">No vendors invited</h3>
                        <p className="text-slate-500 text-sm mb-4">Invite vendors to receive proposals.</p>
                        <Button onClick={onManageInvites}>Invite Vendors</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

