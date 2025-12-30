/**
 * RFP Types
 * TypeScript interfaces for RFP and chat-related data structures
 */

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface RfpItem {
    name: string
    quantity: number
    description?: string
    specifications?: string[]
    warranty?: string  // Per-item warranty (e.g., "2 years", "1 year")
}

export interface CollectedData {
    items: RfpItem[]
    budget?: number
    currency?: string
    deliveryDays?: number
    paymentTerms?: string
    warrantyTerms?: string
    additionalTerms?: string
}

export interface CreatedRfp {
    id: number
    title: string
    status: string
}

export interface ChatResponse {
    message: string
    status: 'gathering' | 'ready_for_preview' | 'confirmed'
    collectedData?: CollectedData
    missingFields?: string[]
    readyForPreview?: boolean
    rfp?: CreatedRfp
}

export interface Rfp {
    id: number
    title: string
    description: string | null
    rawInput: string
    items: RfpItem[]
    budget: number | null
    currency: string
    deadline: string | null
    deliveryDays: number | null
    paymentTerms: string | null
    warrantyTerms: string | null
    additionalTerms: string | null
    status: 'draft' | 'sent' | 'evaluating' | 'awarded' | 'closed'
    createdAt: string
    updatedAt: string
    proposalCount?: number
    proposals?: Proposal[]
    vendors?: any[] // Keep loose for now or type strictly if RfpWithVendors is used
}

export interface Proposal {
    id: number
    rfpId: number
    vendorId: number
    vendor?: {
        id: number
        name: string
        email: string
    }
    totalPrice: number
    currency: string
    aiScore: number
    aiSummary: string
    receivedAt: string
    items: ProposalItem[]
    deliveryDays?: number
    paymentTerms?: string
    warrantyTerms?: string
    notes?: string
}

export interface ProposalItem {
    id: number
    itemName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    description: string
    warranty?: string
}

export interface RfpListResponse {
    rfps: Rfp[]
    total: number
    page: number
    totalPages: number
}

export interface RfpFilters {
    status?: string
    page?: number
    limit?: number
}
