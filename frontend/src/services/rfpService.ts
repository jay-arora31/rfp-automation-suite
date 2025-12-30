import api from './api'
import type { Rfp, RfpListResponse, RfpFilters } from '@/types/rfp'
import type { Vendor } from '@/types/vendor'

export interface RfpWithVendors extends Rfp {
    vendors: {
        id: number
        name: string
        email: string
        sentAt: string | null
        status: string
        hasProposal: boolean
        proposalId: number | null
        followUpCount?: number
        lastFollowUpAt?: string | null
        missingFields?: string[]
    }[]
    awardedVendorId?: number | null
    awardedAt?: string | null
    awardedVendor?: {
        id: number
        name: string
        email: string
    } | null
}

export interface SendResult {
    vendorId: number
    status: 'sent' | 'failed'
    error?: string
}

export interface SendResponse {
    success: boolean
    message: string
    results: SendResult[]
}

/**
 * RFP Service
 * API calls for RFP management operations
 */
export const rfpService = {
    /**
     * Get paginated list of RFPs with optional status filtering
     */
    async getRfps(filters: RfpFilters = {}): Promise<RfpListResponse> {
        const params = new URLSearchParams()

        if (filters.status) params.append('status', filters.status)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await api.get<RfpListResponse>(`/api/rfp?${params.toString()}`)
        return response.data
    },

    /**
     * Get a single RFP by ID with vendors and proposals
     */
    async getRfpById(id: number): Promise<RfpWithVendors> {
        const response = await api.get<RfpWithVendors>(`/api/rfp/${id}`)
        return response.data
    },

    /**
     * Send RFP to selected vendors via Gmail
     */
    async sendToVendors(rfpId: number, vendorIds: number[]): Promise<SendResponse> {
        const response = await api.post<SendResponse>(`/api/rfp/${rfpId}/send`, { vendorIds })
        return response.data
    },

    /**
     * Compare all proposals for an RFP (legacy sync method)
     */
    async compareProposals(rfpId: number): Promise<ComparisonResult> {
        const response = await api.get<ComparisonResult>(`/api/rfp/${rfpId}/compare`)
        return response.data
    },

    /**
     * Get latest saved comparison for an RFP
     */
    async getComparison(rfpId: number): Promise<SavedComparison | null> {
        const response = await api.get<SavedComparison | null>(`/api/rfp/${rfpId}/comparison`)
        return response.data
    },

    /**
     * Get comparison status (for polling)
     */
    async getComparisonStatus(rfpId: number): Promise<ComparisonStatus> {
        const response = await api.get<ComparisonStatus>(`/api/rfp/${rfpId}/comparison/status`)
        return response.data
    },

    /**
     * Trigger a new comparison (runs in background)
     */
    async triggerComparison(rfpId: number): Promise<TriggerComparisonResponse> {
        const response = await api.post<TriggerComparisonResponse>(`/api/rfp/${rfpId}/comparison/trigger`)
        return response.data
    },

    /**
     * Award RFP to a specific vendor
     */
    async awardVendor(rfpId: number, vendorId: number): Promise<AwardResponse> {
        const response = await api.post<AwardResponse>(`/api/rfp/${rfpId}/award`, { vendorId })
        return response.data
    }
}

export interface ComparisonResult {
    rfpId: number
    rfpTitle: string
    budget: number | null
    deliveryDays: number | null
    items: Array<{ name: string; quantity: number; specifications?: string[] }>
    comparison: {
        summary: string
        recommendation: {
            vendorId: number
            vendorName: string
            reason: string
            confidence: number
        } | null
        rankings: VendorRanking[]
        comparisonNotes: string
        riskAssessment: string
        criteria: {
            priceWeight: number
            deliveryWeight: number
            warrantyWeight: number
            completenessWeight: number
        }
    }
}

export interface VendorRanking {
    rank: number
    vendorId: number
    vendorName: string
    totalPrice: number
    deliveryDays?: number
    warranty?: string
    score: number
    scoreBreakdown?: {
        price: number
        delivery: number
        warranty: number
        completeness: number
    }
    reasoning: string
    pros: string[]
    cons: string[]
    items?: Array<{
        name: string
        unitPrice: number
        quantity: number
        totalPrice: number
        warranty?: string
    }>
}

export interface SavedComparison {
    id: number
    rfpId: number
    rfpTitle: string
    status: string
    proposalCount: number
    comparison: ComparisonResult['comparison']
    completedAt: string
}

export interface ComparisonStatus {
    id?: number
    status: 'none' | 'pending' | 'processing' | 'completed' | 'failed'
    startedAt?: string
    completedAt?: string
}

export interface TriggerComparisonResponse {
    id?: number
    status: string
    message: string
}

export interface AwardResponse {
    success: boolean
    message: string
    rfp: {
        id: number
        status: string
        awardedVendorId: number
        awardedAt: string
        awardedVendor: {
            id: number
            name: string
            email: string
        }
    }
}
