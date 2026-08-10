import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { NavProgress } from '@/components/layout/nav-progress'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <NavProgress />
      <AdminSidebar />
      <main className="md:pl-60">
        {children}
      </main>
    </div>
  )
}
