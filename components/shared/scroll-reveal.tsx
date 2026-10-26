'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(!isHomePage)

  useEffect(() => {
    if (!isHomePage) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isHomePage])

  // في جميع صفحات الموقع ما عدا الرئيسية، تظهر العناصر فوراً بدون أي تأخير أو إخفاء عند السكرول
  if (!isHomePage) {
    return className ? <div className={className}>{children}</div> : <>{children}</>
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}