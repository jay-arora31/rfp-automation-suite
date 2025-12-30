import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Loader2, CheckCircle2, FileText, ExternalLink, Sparkles, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatService } from '@/services/chatService'
import type { ChatMessage, CollectedData, CreatedRfp } from '@/types/rfp'

interface LocationState {
    initialMessage?: string
}

export function ChatRFP() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as LocationState | null

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatStatus, setChatStatus] = useState<'gathering' | 'ready_for_preview' | 'confirmed'>('gathering')
    const [collectedData, setCollectedData] = useState<CollectedData | null>(null)
    const [createdRfp, setCreatedRfp] = useState<CreatedRfp | null>(null)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isProcessingRef = useRef(false) // Prevent double API calls in StrictMode

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Handle initial message from dashboard
    useEffect(() => {
        if (state?.initialMessage && messages.length === 0 && !isProcessingRef.current) {
            handleSendMessage(state.initialMessage)
            window.history.replaceState({}, document.title)
        }
    }, [state?.initialMessage])

    const handleSendMessage = async (messageText: string) => {
        // Use ref to prevent duplicate calls from React StrictMode
        if (!messageText.trim() || isLoading || isProcessingRef.current) return
        isProcessingRef.current = true

        const userMessage: ChatMessage = { role: 'user', content: messageText.trim() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)
        setError(null)

        try {
            const response = await chatService.sendMessage(updatedMessages)

            const assistantMessage: ChatMessage = { role: 'assistant', content: response.message }
            setMessages(prev => [...prev, assistantMessage])

            setChatStatus(response.status)
            if (response.collectedData) setCollectedData(response.collectedData)
            if (response.rfp) setCreatedRfp(response.rfp)
        } catch (err) {
            console.error('Chat error:', err)
            setError('Failed to get response. Please try again.')
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request. Please try again.'
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
            isProcessingRef.current = false // Reset ref after request completes
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSendMessage(input)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleConfirmRfp = () => {
        handleSendMessage('Yes, create this RFP')
    }

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="min-h-full bg-[#f7f9fc] p-6 font-sans flex flex-col h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 h-full">

                {/* Chat Column */}
                <div className="col-span-12 lg:col-span-8 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#635bff]/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-[#635bff]" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">AI RFP Assistant</h2>
                                <p className="text-xs text-slate-500">Drafting your procurement requirements</p>
                            </div>
                        </div>
                        {chatStatus === 'confirmed' && (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                RFP Created
                            </span>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                                    <Sparkles className="h-8 w-8 text-[#635bff]" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">How can I help you today?</h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-8">
                                    I can help you draft a Request for Proposal. Just describe what you need, your budget, and timeline.
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                    {["I need 50 Macbook Pros", "Office cleaning service", "Cloud hosting provider", "Marketing agency"].map((suggest, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(suggest)}
                                            className="text-xs text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-[#635bff] hover:text-[#635bff] transition-colors shadow-sm"
                                        >
                                            {suggest}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'flex gap-4 max-w-[85%]',
                                    message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                )}
                            >
                                <div className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm border',
                                    message.role === 'user'
                                        ? 'bg-[#635bff] border-[#635bff] text-white'
                                        : 'bg-white border-slate-200 text-[#635bff]'
                                )}>
                                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    'rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm',
                                    message.role === 'user'
                                        ? 'bg-[#635bff] text-white rounded-tr-sm'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                )}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 max-w-[85%]">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-[#635bff] shadow-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                                <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-3.5 text-sm shadow-sm">
                                    <span className="animate-pulse">Reasoning...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={chatStatus === 'confirmed' ? 'RFP created! Start a new conversation...' : 'Type your requirements...'}
                                disabled={isLoading}
                                className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] transition-all placeholder:text-slate-400 text-slate-800"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-2 h-10 w-10 p-0 rounded-lg bg-[#635bff] hover:bg-[#544dc9] text-white shadow-sm"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Draft Preview Column (Collapsible on mobile via hidden lg:flex) */}
                <div className="hidden lg:flex col-span-4 flex-col gap-4 h-full">
                    {/* Live Draft Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" />
                                Live Draft Preview
                            </h3>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto space-y-6">
                            {!collectedData && !createdRfp ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                                        <FileText className="h-5 w-5 opacity-50" />
                                    </div>
                                    <p className="text-sm">RFP details will appear here<br />as you chat.</p>
                                </div>
                            ) : (
                                <>
                                    {createdRfp && (
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 bg-emerald-100 p-1 rounded-full">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-emerald-900">Creation Successful</h4>
                                                    <p className="text-xs text-emerald-700 mt-1">
                                                        RFP #{createdRfp.id} has been saved to your drafts.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {collectedData && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {/* Items Section */}
                                            {collectedData.items && collectedData.items.length > 0 && (
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Line Items</label>
                                                    <div className="space-y-2">
                                                        {collectedData.items.map((item, idx) => (
                                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-medium text-slate-800 text-sm">{item.name}</span>
                                                                    <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">x{item.quantity}</span>
                                                                </div>
                                                                {item.description && (
                                                                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Budget & Terms */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {collectedData.budget && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Estimated Budget</label>
                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                            {formatCurrency(collectedData.budget, collectedData.currency)}
                                                        </div>
                                                    </div>
                                                )}

                                                {(collectedData.deliveryDays || collectedData.paymentTerms) && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {collectedData.deliveryDays && (
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Delivery</label>
                                                                <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                                    {collectedData.deliveryDays} Days
                                                                </div>
                                                            </div>
                                                        )}
                                                        {collectedData.paymentTerms && (
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Terms</label>
                                                                <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 truncate" title={collectedData.paymentTerms}>
                                                                    {collectedData.paymentTerms}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            {chatStatus === 'ready_for_preview' && !createdRfp && (
                                <Button
                                    onClick={handleConfirmRfp}
                                    className="w-full bg-[#635bff] hover:bg-[#544dc9] text-white shadow-sm"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Create Final RFP
                                </Button>
                            )}
                            {createdRfp && (
                                <Button
                                    onClick={() => navigate(`/rfps/${createdRfp.id}`)}
                                    variant="outline"
                                    className="w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#635bff]"
                                >
                                    View Details <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                            {!createdRfp && chatStatus !== 'ready_for_preview' && (
                                <p className="text-xs text-center text-slate-400">
                                    Continue chatting to finalize details
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
