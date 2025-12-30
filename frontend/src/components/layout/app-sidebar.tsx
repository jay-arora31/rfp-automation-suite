import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    Users,
    FileText,
    Settings,
    Sparkles
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarRail,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const menuItems = [
    {
        title: 'Dashboard',
        url: '/',
        icon: Home,
    },
    {
        title: 'Vendors',
        url: '/vendors',
        icon: Users,
    },
    {
        title: 'RFPs',
        url: '/rfps',
        icon: FileText,
    },
]

export function AppSidebar() {
    const location = useLocation()

    return (
        <Sidebar className="border-r border-border bg-sidebar/50 backdrop-blur-xl">
            <SidebarHeader className="border-b border-border/50 px-6 py-5">
                <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-purple-500/20">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base leading-none tracking-tight">RFPs Automation Suite</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5"></span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent className="px-3 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                        Platform
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url))
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                "h-10 px-3 transition-all duration-200",
                                                isActive
                                                    ? 'bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20'
                                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                            )}
                                        >
                                            <Link to={item.url} className="flex items-center gap-3">
                                                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/50 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className={cn(
                                "h-10 px-3 transition-all duration-200 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                location.pathname === '/settings' && 'bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20'
                            )}
                        >
                            <Link to="/settings" className="flex items-center gap-3">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
