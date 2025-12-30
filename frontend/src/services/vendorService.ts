import api from './api'
import type { Vendor, VendorListResponse, VendorFormData, VendorFilters } from '@/types/vendor'

/**
 * Vendor Service
 * API calls for vendor CRUD operations
 */
export const vendorService = {
    /**
     * Get paginated list of vendors with optional filtering
     */
    async getVendors(filters: VendorFilters = {}): Promise<VendorListResponse> {
        const params = new URLSearchParams()

        if (filters.search) params.append('search', filters.search)
        if (filters.category) params.append('category', filters.category)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await api.get<VendorListResponse>(`/api/vendors?${params.toString()}`)
        return response.data
    },

    /**
     * Get a single vendor by ID
     */
    async getVendorById(id: number): Promise<Vendor> {
        const response = await api.get<Vendor>(`/api/vendors/${id}`)
        return response.data
    },

    /**
     * Create a new vendor
     */
    async createVendor(data: VendorFormData): Promise<Vendor> {
        const response = await api.post<Vendor>('/api/vendors', data)
        return response.data
    },

    /**
     * Update an existing vendor
     */
    async updateVendor(id: number, data: VendorFormData): Promise<Vendor> {
        const response = await api.put<Vendor>(`/api/vendors/${id}`, data)
        return response.data
    },

    /**
     * Delete a vendor
     */
    async deleteVendor(id: number): Promise<void> {
        await api.delete(`/api/vendors/${id}`)
    }
}
