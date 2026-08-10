import { Sidebar } from '@/components/layout/sidebar'
import { NavProgress } from '@/components/layout/nav-progress'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <NavProgress />
      <Sidebar />
      <main className="md:pl-60">
        {children}
      </main>
    </div>
  )
}
