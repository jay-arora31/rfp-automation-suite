import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { GmailAuthProvider } from '@/contexts/GmailAuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
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
      <GmailAuthProvider>
        <Routes>
          {/* Protected Routes - require Gmail connection */}
          <Route path="/" element={
            <AppLayout>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/chat" element={
            <AppLayout>
              <ProtectedRoute>
                <ChatRFP />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/vendors" element={
            <AppLayout>
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/rfps" element={
            <AppLayout>
              <ProtectedRoute>
                <Rfps />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/rfps/:id" element={
            <AppLayout>
              <ProtectedRoute>
                <RfpDetail />
              </ProtectedRoute>
            </AppLayout>
          } />
          
          {/* Settings - accessible without Gmail connection */}
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        </Routes>
      </GmailAuthProvider>
    </BrowserRouter>
  )
}

export default App
