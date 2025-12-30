/**
 * Vendor Types
 * TypeScript interfaces for vendor-related data structures
 */

export interface Vendor {
    id: number
    name: string
    email: string
    company: string | null
    phone: string | null
    category: string | null
    address: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export interface VendorListResponse {
    vendors: Vendor[]
    total: number
    page: number
    totalPages: number
}

export interface VendorFormData {
    name: string
    email: string
    company?: string
    phone?: string
    category?: string
    address?: string
    notes?: string
}

export interface VendorFilters {
    search?: string
    category?: string
    page?: number
    limit?: number
}
