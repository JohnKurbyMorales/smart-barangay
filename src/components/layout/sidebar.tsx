'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Map, Megaphone, Bot, Bell, User, LogOut,
  Shield, Users, Settings, ClipboardList, Activity, Menu, X, ShieldAlert
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Resident navigation - reporting features only
const residentNavItems = [
  { href: '/submit-report', label: 'Report Incident', icon: FileText },
  { href: '/reports',       label: 'My Reports',      icon: ClipboardList },
  { href: '/map',           label: 'View Map',         icon: Map },
  { href: '/announcements', label: 'Announcements',    icon: Megaphone },
  { href: '/assistant',     label: 'Get Help',         icon: Bot },
  { href: '/notifications', label: 'Notifications',    icon: Bell },
  { href: '/profile',       label: 'My Profile',       icon: User },
]

// Admin quick-access navigation (same resident features + admin link)
const adminNavItems = [
  { href: '/submit-report', label: 'Submit Report', icon: FileText },
  { href: '/reports',       label: 'All Reports',   icon: ClipboardList },
  { href: '/map',           label: 'Map View',       icon: Map },
  { href: '/announcements', label: 'Announcements',  icon: Megaphone },
  { href: '/assistant',     label: 'AI Assistant',   icon: Bot },
]

// Admin management section
const adminManageItems = [
  { href: '/admin',              label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/residents',    label: 'Residents',       icon: Users },
  { href: '/admin/staff',        label: 'Staff',           icon: Users },
  { href: '/admin/categories',   label: 'Categories',      icon: Activity },
  { href: '/admin/audit-logs',   label: 'Audit Logs',      icon: ClipboardList },
  { href: '/admin/settings',     label: 'Settings',        icon: Settings },
]

export function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user }  = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff'

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const NavLink = ({ item }: { item: { href: string; label: string; icon: any } }) => {
    const Icon   = item.icon
    const active = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href + '/'))

    return (
      <Link
        href={item.href}
        prefetch={true}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          active
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">SMART-Barangay</p>
            <p className="text-xs text-muted-foreground">Incident Reporting System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Resident or admin quick-access nav */}
        {(isAdminOrStaff ? adminNavItems : residentNavItems).map(item => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Admin management section */}
        {isAdminOrStaff && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminManageItems.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex-shrink-0"
            onClick={handleLogout}
            disabled={loggingOut}
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
        className="fixed top-4 left-4 z-50 md:hidden bg-background border border-border rounded-lg p-2 shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen w-60 bg-background border-r border-border transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
