import { FileText, Mail, Clock, Award } from 'lucide-react'

const STEPS = [
    { id: 'draft', label: 'Draft', icon: FileText },
    { id: 'sent', label: 'Sent', icon: Mail },
    { id: 'evaluating', label: 'Evaluating', icon: Clock },
    { id: 'awarded', label: 'Awarded', icon: Award }
]

interface RfpTimelineProps {
    status: string
    hasComparison: boolean
}

export function RfpTimeline({ status, hasComparison }: RfpTimelineProps) {
    const getCurrentStepIndex = (status: string) => {
        return STEPS.findIndex(s => s.id === status)
    }

    const currentStepIndex = getCurrentStepIndex(status)

    // Calculate progress width
    const getProgressWidth = () => {
        if (status === 'awarded') {
            return 100
        }
        if (hasComparison && status === 'evaluating') {
            return (3 / (STEPS.length - 1)) * 100
        }
        return (currentStepIndex / (STEPS.length - 1)) * 100
    }

    return (
        <div className="bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                <div className="relative">
                    {/* Progress Track */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#635bff] to-[#8b85ff] rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${getProgressWidth()}%` }}
                        />
                    </div>
                    
                    {/* Steps */}
                    <div className="relative flex justify-between">
                        {STEPS.map((step, index) => {
                            const evaluatingCompleted = step.id === 'evaluating' && hasComparison
                            const awardedCompleted = step.id === 'awarded' && status === 'awarded'
                            const isCompleted = index < currentStepIndex || evaluatingCompleted || awardedCompleted
                            const isActive = (index === currentStepIndex && !evaluatingCompleted && !awardedCompleted) || 
                                           (step.id === 'awarded' && evaluatingCompleted && status !== 'awarded')
                            const isPending = index > currentStepIndex && !isActive && !awardedCompleted
                            const Icon = step.icon

                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    {/* Step Circle */}
                                    <div className={`
                                        relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isCompleted ? 'bg-[#635bff] text-white shadow-lg shadow-[#635bff]/30' : ''}
                                        ${isActive ? 'bg-[#635bff] text-white ring-4 ring-[#635bff]/20 shadow-lg shadow-[#635bff]/30 scale-110' : ''}
                                        ${isPending ? 'bg-white text-slate-400 border-2 border-slate-200' : ''}
                                    `}>
                                        <Icon className="h-5 w-5" />
                                        {isCompleted && (
                                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Step Label */}
                                    <span className={`
                                        mt-3 text-xs font-semibold uppercase tracking-wider transition-colors
                                        ${isActive ? 'text-[#635bff]' : ''}
                                        ${isCompleted ? 'text-slate-700' : ''}
                                        ${isPending ? 'text-slate-400' : ''}
                                    `}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

