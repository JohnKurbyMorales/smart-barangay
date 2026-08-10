'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function NavProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Page changed - complete the bar
      setProgress(100)
      const t = setTimeout(() => setVisible(false), 300)
      prevPathname.current = pathname
      return () => clearTimeout(t)
    }
  }, [pathname])

  useEffect(() => {
    // On mount start the bar climbing
    setVisible(true)
    setProgress(10)

    const steps = [30, 60, 80, 90]
    const timers: NodeJS.Timeout[] = []
    steps.forEach((p, i) => {
      const t = setTimeout(() => setProgress(p), (i + 1) * 200)
      timers.push(t)
    })

    return () => timers.forEach(clearTimeout)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
