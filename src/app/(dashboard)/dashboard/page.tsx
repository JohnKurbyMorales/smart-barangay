'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && user) {
      // Redirect residents to submit report (their main functionality)
      if (user.role === 'resident') {
        router.replace('/submit-report')
      }
      // Admin and staff can access analytics in admin panel
      else if (user.role === 'admin' || user.role === 'staff') {
        router.replace('/admin')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return null
}