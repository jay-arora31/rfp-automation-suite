import { useState, useMemo } from 'react'
import { Search, Send, Loader2 } from 'lucide-react'
import type { Vendor } from '@/types/vendor'
import styles from '@/styles/rfp-detail.module.css'

interface SendRfpDialogProps {
    open: boolean
    vendors: Vendor[]
    selectedVendors: number[]
    sending: boolean
    onClose: () => void
    onSend: () => void
    onSelectionChange: (vendorIds: number[]) => void
}

export function SendRfpDialog({
    open,
    vendors,
    selectedVendors,
    sending,
    onClose,
    onSend,
    onSelectionChange
}: SendRfpDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredVendors = useMemo(() => {
        if (!searchQuery) return vendors
        const lowerQ = searchQuery.toLowerCase()
        return vendors.filter(v =>
            v.name.toLowerCase().includes(lowerQ) ||
            v.email.toLowerCase().includes(lowerQ) ||
            v.company?.toLowerCase().includes(lowerQ)
        )
    }, [vendors, searchQuery])

    const handleSelectAll = () => {
        const filteredIds = filteredVendors.map(v => v.id)
        const allSelected = filteredIds.every(id => selectedVendors.includes(id))

        if (allSelected) {
            onSelectionChange(selectedVendors.filter(id => !filteredIds.includes(id)))
        } else {
            const newSelected = [...new Set([...selectedVendors, ...filteredIds])]
            onSelectionChange(newSelected)
        }
    }

    const handleToggleVendor = (vendorId: number) => {
        if (selectedVendors.includes(vendorId)) {
            onSelectionChange(selectedVendors.filter(id => id !== vendorId))
        } else {
            onSelectionChange([...selectedVendors, vendorId])
        }
    }

    const isAllSelected = filteredVendors.length > 0 && filteredVendors.every(v => selectedVendors.includes(v.id))
    const isIndeterminate = filteredVendors.some(v => selectedVendors.includes(v.id)) && !isAllSelected

    if (!open) return null

    return (
        <div className={styles.dialogOverlay} onClick={onClose}>
            <div className={styles.dialogContent} style={{ width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className={`${styles.dialogHeader} border-b pb-4 mb-0`}>
                    <h2 className={styles.dialogTitle}>Select Vendors</h2>
                    <p className="text-sm text-slate-500 mt-1">Choose vendors to invite to this RFP.</p>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]"
                        />
                    </div>

                    {/* Select All */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={isAllSelected}
                            ref={input => { if (input) input.indeterminate = !!isIndeterminate }}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-[#635bff] focus:ring-[#635bff]"
                            disabled={filteredVendors.length === 0}
                        />
                        <label htmlFor="selectAll" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                            Select All ({selectedVendors.length} selected)
                        </label>
                    </div>
                </div>

                <div className={`${styles.dialogBody} p-0 max-h-[300px] overflow-y-auto`}>
                    {filteredVendors.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredVendors.map(v => (
                                <div
                                    key={v.id}
                                    className={`flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedVendors.includes(v.id) ? 'bg-[#635bff]/5' : ''}`}
                                    onClick={() => handleToggleVendor(v.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedVendors.includes(v.id)}
                                        onChange={() => {}}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#635bff] focus:ring-[#635bff]"
                                        readOnly
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{v.name}</p>
                                        <p className="text-xs text-slate-500">{v.email}</p>
                                    </div>
                                    {v.category && (
                                        <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                            {v.category}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? 'No vendors found matching query' : 'No vendors available'}
                        </div>
                    )}
                </div>

                <div className={`${styles.dialogFooter} border-t pt-4 mt-0 bg-slate-50/50 rounded-b-xl`}>
                    <button className={`${styles.cancelBtn} bg-white border border-slate-200 hover:bg-slate-50`} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.sendBtn}
                        onClick={onSend}
                        disabled={sending || selectedVendors.length === 0}
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Invite ({selectedVendors.length})
                    </button>
                </div>
            </div>
        </div>
    )
}

