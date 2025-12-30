import { useEffect, useState, useCallback } from 'react'
import { vendorService } from '@/services/vendorService'
import type { Vendor, VendorFormData } from '@/types/vendor'
import {
    Plus, Search, Pencil, Trash2, Loader2, Users,
    CheckCircle2, AlertCircle
} from 'lucide-react'
import styles from '@/styles/vendors.module.css'

const CATEGORIES = [
    'Technology',
    'Office Supplies',
    'Furniture',
    'Services',
    'Manufacturing',
    'Logistics',
    'Other'
]

export function Vendors() {
    // State
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<VendorFormData>({
        name: '',
        email: '',
        phone: '',
        category: '',
        address: '',
        notes: ''
    })

    // Delete confirmation state
    const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null)

    // Fetch vendors
    const fetchVendors = useCallback(async () => {
        try {
            setLoading(true)
            const result = await vendorService.getVendors({
                page,
                search: search || undefined,
                category: category || undefined
            })
            setVendors(result.vendors)
            setTotalPages(result.totalPages)
            setTotal(result.total)
        } catch (error) {
            console.error('Failed to fetch vendors:', error)
            showNotification('error', 'Failed to load vendors')
        } finally {
            setLoading(false)
        }
    }, [page, search, category])

    useEffect(() => {
        fetchVendors()
    }, [fetchVendors])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Notification helper
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 4000)
    }

    // Dialog handlers
    const openAddDialog = () => {
        setEditingVendor(null)
        setFormData({ name: '', email: '', phone: '', category: '', address: '', notes: '' })
        setDialogOpen(true)
    }

    const openEditDialog = (vendor: Vendor) => {
        setEditingVendor(vendor)
        setFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || '',
            category: vendor.category || '',
            address: vendor.address || '',
            notes: vendor.notes || ''
        })
        setDialogOpen(true)
    }

    const closeDialog = () => {
        setDialogOpen(false)
        setEditingVendor(null)
    }

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email) return

        try {
            setSubmitting(true)
            if (editingVendor) {
                await vendorService.updateVendor(editingVendor.id, formData)
                showNotification('success', 'Vendor updated successfully')
            } else {
                await vendorService.createVendor(formData)
                showNotification('success', 'Vendor created successfully')
            }
            closeDialog()
            fetchVendors()
        } catch (error) {
            console.error('Failed to save vendor:', error)
            showNotification('error', 'Failed to save vendor')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (vendor: Vendor) => {
        setDeleteVendor(vendor)
    }

    const confirmDelete = async () => {
        if (!deleteVendor) return

        try {
            await vendorService.deleteVendor(deleteVendor.id)
            showNotification('success', 'Vendor deleted successfully')
            fetchVendors()
            setDeleteVendor(null)
        } catch (error) {
            console.error('Failed to delete vendor:', error)
            showNotification('error', 'Failed to delete vendor')
        }
    }

    return (
        <div className={`${styles.container} p-6 lg:p-8 max-w-7xl mx-auto`}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Vendors</h1>
                <button className={styles.addBtn} onClick={openAddDialog}>
                    <Plus className="w-4 h-4" />
                    Add Vendor
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search vendors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className={styles.categorySelect}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

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

            {/* Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <Loader2 className={styles.loadingSpinner} />
                        <span>Loading vendors...</span>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Users className={styles.emptyIcon} />
                        <h3>No vendors found</h3>
                        <p>{search || category ? 'Try adjusting your filters' : 'Add your first vendor to get started'}</p>
                    </div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map(vendor => (
                                    <tr key={vendor.id}>
                                        <td className={styles.vendorName}>{vendor.name}</td>
                                        <td className={styles.vendorEmail}>{vendor.email}</td>
                                        <td>
                                            {vendor.category && (
                                                <span className={styles.categoryBadge}>{vendor.category}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={styles.actionsCell}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => openEditDialog(vendor)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                                    onClick={() => handleDeleteClick(vendor)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <span className={styles.paginationInfo}>
                                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} vendors
                                </span>
                                <div className={styles.paginationControls}>
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => p - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`${styles.paginationBtn} ${page === pageNum ? styles.paginationBtnActive : ''}`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Dialog */}
            {dialogOpen && (
                <div className={styles.dialogOverlay} onClick={closeDialog}>
                    <div className={styles.dialogContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.dialogHeader}>
                            <h2 className={styles.dialogTitle}>
                                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.dialogBody}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>
                                                Vendor Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                placeholder="Company or vendor name"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                placeholder="vendor@example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                        >
                                            <option value="">Select category</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="Street address"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className={styles.formTextarea}
                                            placeholder="Additional notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.dialogFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={closeDialog}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={submitting || !formData.name || !formData.email}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingVendor ? 'Save Changes' : 'Add Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteVendor && (
                <div className={styles.dialogOverlay} onClick={() => setDeleteVendor(null)}>
                    <div className={styles.dialogContent} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.dialogHeader}>
                            <h2 className={`${styles.dialogTitle} text-red-600 flex items-center gap-2`}>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                Delete Vendor
                            </h2>
                        </div>
                        <div className={styles.dialogBody}>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteVendor.name}</span>?
                            </p>
                            <p className="text-sm text-gray-500 bg-red-50 p-3 rounded-md border border-red-100">
                                This action cannot be undone. All associated data (proposals, history) will be permanently removed.
                            </p>
                        </div>
                        <div className={styles.dialogFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setDeleteVendor(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                style={{ background: '#EF4444', boxShadow: 'none' }}
                                onClick={confirmDelete}
                            >
                                Delete Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
