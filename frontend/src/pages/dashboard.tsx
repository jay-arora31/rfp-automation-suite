import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
    ArrowRight, FileText, Users, Activity, CheckCircle2, Sparkles, 
    Clock, Award, Send, ChevronRight
} from 'lucide-react'
import { rfpService } from '@/services/rfpService'
import { vendorService } from '@/services/vendorService'

export function Dashboard() {
    const [chatInput, setChatInput] = useState('')
    const [stats, setStats] = useState({ totalRfps: 0, activeRfps: 0, completedRfps: 0, totalVendors: 0 })
    const [recentRfps, setRecentRfps] = useState<any[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all stats including in-progress (draft + sent + evaluating)
                const [rfps, draft, sent, evaluating, completed, vendors] = await Promise.all([
                    rfpService.getRfps({ limit: 5 }),
                    rfpService.getRfps({ status: 'draft', limit: 1 }),
                    rfpService.getRfps({ status: 'sent', limit: 1 }),
                    rfpService.getRfps({ status: 'evaluating', limit: 1 }),
                    rfpService.getRfps({ status: 'awarded', limit: 1 }),
                    vendorService.getVendors({ limit: 1 })
                ])
                setStats({
                    totalRfps: rfps.total,
                    activeRfps: draft.total + sent.total + evaluating.total, // In Progress = draft + sent + evaluating
                    completedRfps: completed.total,
                    totalVendors: vendors.total
                })
                setRecentRfps(rfps.rfps)
            } catch (e) { console.error(e) }
        }
        fetchData()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (chatInput.trim()) navigate('/chat', { state: { initialMessage: chatInput.trim() } })
    }

    const getStatusConfig = (s: string) => {
        const map: Record<string, { bg: string; text: string; icon: any }> = {
            draft: { bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText },
            sent: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Send },
            evaluating: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
            awarded: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Award },
        }
        return map[s.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText }
    }

    const statCards = [
        { label: 'Total RFPs', value: stats.totalRfps, icon: FileText, accent: 'bg-violet-500' },
        { label: 'In Progress', value: stats.activeRfps, icon: Activity, accent: 'bg-blue-500' },
        { label: 'Awarded', value: stats.completedRfps, icon: CheckCircle2, accent: 'bg-emerald-500' },
        { label: 'Vendors', value: stats.totalVendors, icon: Users, accent: 'bg-slate-500' }
    ]

    return (
        <div className="min-h-full bg-[#fafbfc]">
            {/* Hero Section with Light Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-50/80 via-white to-purple-50/50">
                {/* Subtle decorative elements */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
                
                <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Welcome back! 👋</h1>
                            <p className="text-slate-500 mt-1">Here's what's happening with your procurement</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/vendors')}
                                variant="outline"
                                className="bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-white shadow-sm"
                            >
                                <Users className="h-4 w-4 mr-2" /> Add Vendor
                            </Button>
                            <Button
                                onClick={() => navigate('/chat')}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                            >
                                <Sparkles className="h-4 w-4 mr-2" /> Create RFP
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid - First */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {statCards.map((stat, i) => (
                            <div 
                                key={i} 
                                onClick={() => navigate('/rfps')}
                                className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-2 h-2 rounded-full ${stat.accent}`} />
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-semibold text-slate-800">{stat.value}</p>
                                    <stat.icon className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input Section - Second */}
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30 mb-5">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">What do you need to procure?</h2>
                        <p className="text-slate-500 text-sm mb-6">Describe your needs and let AI create the perfect RFP</p>

                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="e.g., '20 laptops for engineering team with 16GB RAM'"
                                    className="w-full h-14 pl-6 pr-32 rounded-full border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm"
                                />
                                <Button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="absolute right-1.5 top-1.5 h-11 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-full shadow-md disabled:opacity-50"
                                >
                                    Start <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </form>

                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {["20 laptops", "Office furniture", "Cloud hosting", "Marketing services"].map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setChatInput(s)} 
                                    className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent RFPs Section */}
            <div className="max-w-5xl mx-auto px-6 pb-8">

                {/* Recent RFPs */}
                {recentRfps.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800">Recent RFPs</h3>
                            <Link 
                                to="/rfps" 
                                className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                            >
                                View All <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentRfps.slice(0, 4).map((rfp) => {
                                const statusConfig = getStatusConfig(rfp.status)
                                return (
                                    <Link 
                                        key={rfp.id}
                                        to={`/rfps/${rfp.id}`}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <div className={`p-2.5 rounded-xl ${statusConfig.bg} shrink-0`}>
                                            <statusConfig.icon className={`h-4 w-4 ${statusConfig.text}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-800 truncate group-hover:text-violet-600 transition-colors">
                                                {rfp.title}
                                            </p>
                                            <p className="text-sm text-slate-400 mt-0.5">
                                                Updated {new Date(rfp.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                                            {rfp.status}
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {recentRfps.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-7 w-7 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No RFPs yet</h3>
                        <p className="text-slate-500 mb-6">Create your first RFP using the AI assistant above</p>
                    </div>
                )}
                
                <div className="h-8" />
            </div>
        </div>
    )
}
