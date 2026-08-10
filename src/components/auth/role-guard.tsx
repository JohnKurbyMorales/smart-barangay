'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: ('resident' | 'staff' | 'admin')[]
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  redirectTo = '/submit-report',
  fallback 
}: RoleGuardProps) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.role))) {
      router.replace(redirectTo)
    }
  }, [user, loading, allowedRoles, redirectTo, router])

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

// Specific role guards for convenience
export const AdminGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleGuard allowedRoles={['admin']} redirectTo="/submit-report" fallback={fallback}>
    {children}
  </RoleGuard>
)

export const StaffGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleGuard allowedRoles={['admin', 'staff']} redirectTo="/submit-report" fallback={fallback}>
    {children}
  </RoleGuard>
)

export const ResidentGuard = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RoleGuard allowedRoles={['resident']} redirectTo="/admin" fallback={fallback}>
    {children}
  </RoleGuard>
)