import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Dashboard } from '@/pages/dashboard'
import { ChatRFP } from '@/pages/chat-rfp'
import { Vendors } from '@/pages/vendors'
import { Rfps } from '@/pages/rfps'
import { RfpDetail } from '@/pages/rfp-detail'
import { Settings } from '@/pages/settings'

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/vendors') return 'Vendors'
  if (pathname === '/rfps') return 'RFPs'
  if (pathname.startsWith('/rfps/')) return 'RFP Detail'
  if (pathname === '/chat') return 'Create RFP'
  if (pathname === '/settings') return 'Settings'
  return 'Dashboard'
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-screen bg-background/50">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-background/60 px-6 py-5 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <span className="font-bold text-base leading-none tracking-tight">{pageTitle}</span>
          </div>
        </header>
        <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/chat" element={<AppLayout><ChatRFP /></AppLayout>} />
        <Route path="/vendors" element={<AppLayout><Vendors /></AppLayout>} />
        <Route path="/rfps" element={<AppLayout><Rfps /></AppLayout>} />
        <Route path="/rfps/:id" element={<AppLayout><RfpDetail /></AppLayout>} />
        <Route path="/email" element={<AppLayout><PlaceholderPage title="Email Polling" /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">Coming soon...</p>
      </div>
    </div>
  )
}

export default App
