'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Shield, Settings, ClipboardList,
  Activity, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/residents', label: 'Residents', icon: Users },
  { href: '/admin/staff', label: 'Staff', icon: Shield },
  { href: '/admin/categories', label: 'Categories', icon: Activity },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/admin/login')
  }

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'

  const isActive = (item: typeof adminNavItems[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">SMART-Barangay</p>
            <p className="text-xs text-white/60 mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          user?.role === 'admin'
            ? 'bg-amber-400/20 text-amber-300'
            : 'bg-blue-400/20 text-blue-300'
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {user?.role === 'admin' ? 'Administrator' : 'Staff'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                active
                  ? 'bg-white text-blue-900 font-semibold shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-600" />}
            </Link>
          )
        })}
      </nav>

      {/* Divider with link to resident view */}
      <div className="px-3 pb-2">
        <Link
          href="/submit-report"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          View Resident Portal
        </Link>
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-white/20 text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-700 rounded-lg p-2 shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen
          ? <X className="w-5 h-5 text-white" />
          : <Menu className="w-5 h-5 text-white" />
        }
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen w-60 transition-transform duration-200',
        'bg-gradient-to-b from-blue-900 to-indigo-950',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
