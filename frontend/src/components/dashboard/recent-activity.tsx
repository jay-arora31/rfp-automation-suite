import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowUpRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface RfpSummary {
    id: number
    title: string
    status: string
    updatedAt: string
}

interface RecentActivityProps {
    recentRfps: RfpSummary[]
}

export function RecentActivity({ recentRfps }: RecentActivityProps) {
    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'draft': return 'secondary'
            case 'sent': return 'default'
            case 'evaluating': return 'warning'
            case 'awarded': return 'success'
            case 'closed': return 'outline'
            default: return 'secondary'
        }
    }

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                <Link to="/rfps" className="text-sm text-primary hover:underline flex items-center">
                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {recentRfps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentRfps.map((rfp) => (
                            <div key={rfp.id} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                            {rfp.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(rfp.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Badge variant={getStatusVariant(rfp.status)}>
                                        {rfp.status}
                                    </Badge>
                                    <Link
                                        to={`/rfps/${rfp.id}`}
                                        className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
