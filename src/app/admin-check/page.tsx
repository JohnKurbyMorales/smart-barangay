'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Shield, User } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function AdminCheckPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUsers(data)
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />
      case 'staff': return <Users className="w-4 h-4 text-blue-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const staffCount = users.filter(u => u.role === 'staff').length
  const residentCount = users.filter(u => u.role === 'resident').length

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">System Users Overview</h1>
          <p className="text-muted-foreground">Check existing users and their roles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{staffCount}</p>
                <p className="text-sm text-muted-foreground">Staff</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <User className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{residentCount}</p>
                <p className="text-sm text-muted-foreground">Residents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link href="/setup-admin">
            <Button variant="default">
              <Shield className="w-4 h-4 mr-2" />
              Create Admin Account
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="outline">
              Admin Login
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">
              User Login
            </Button>
          </Link>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No users found</p>
            ) : (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {roleIcon(user.role)}
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs border ${roleColor(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}