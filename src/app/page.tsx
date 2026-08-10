import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, FileText, Map, Bot, Bell, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">SMART-Barangay</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login"><Button variant="outline">Sign In</Button></Link>
          <Link href="/register"><Button>Get Started</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Bot className="w-4 h-4" /> AI-Enhanced System
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Barangay Incident<br />
          <span className="text-primary">Reporting & Monitoring</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          A smart, AI-powered platform for residents to report incidents and barangay officials to monitor, analyze, and respond efficiently.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/register"><Button size="lg">Start Reporting</Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">Sign In</Button></Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: 'Easy Reporting', desc: 'Submit incident reports with photo uploads and location tagging in minutes.', color: '#2563eb' },
            { icon: Bot, title: 'AI Classification', desc: 'Automatic incident classification, priority assessment, and department routing.', color: '#7c3aed' },
            { icon: Map, title: 'GIS Map View', desc: 'Real-time map with street and satellite views showing all active incidents.', color: '#059669' },
            { icon: Bell, title: 'Live Notifications', desc: 'Instant notifications when your report status changes or is updated.', color: '#d97706' },
            { icon: Users, title: 'Role-based Access', desc: 'Residents, staff, and admin roles with appropriate dashboards and controls.', color: '#dc2626' },
            { icon: ShieldAlert, title: 'Analytics Dashboard', desc: 'Charts, trends, and AI insights to help officials make data-driven decisions.', color: '#0891b2' },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="bg-primary rounded-3xl p-10 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to make your barangay safer?</h2>
          <p className="text-blue-100 mb-6">Join thousands of residents already using SMART-Barangay</p>
          <Link href="/register"><Button size="lg" variant="secondary">Create Free Account</Button></Link>
        </div>
      </section>

      <footer className="text-center text-sm text-muted-foreground py-8">
        © {new Date().getFullYear()} SMART-Barangay. All rights reserved.
      </footer>
    </div>
  )
}
