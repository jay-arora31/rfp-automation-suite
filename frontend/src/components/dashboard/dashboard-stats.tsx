import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, FileText, CheckCircle2 } from 'lucide-react'

interface StatsProps {
    totalRfps: number
    activeRfps: number
    completedRfps: number
    totalVendors: number
}

export function DashboardStats({ totalRfps, activeRfps, completedRfps, totalVendors }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total RFPs</CardTitle>
                    <FileText className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRfps}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Lifetime created
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active RFPs</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeRfps}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Running procurements
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedRfps}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Successfully awarded
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Vendor Network</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalVendors}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Verified suppliers
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
