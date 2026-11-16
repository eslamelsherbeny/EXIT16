'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

export function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dir } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!loading) return
    setProgress(100)
    const timer = setTimeout(() => {
      setLoading(false)
      setProgress(0)
    }, 220)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      const anchor = (e.target as HTMLElement)?.closest?.('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')

      if (
        !href ||
        target === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      try {
        const nextUrl = new URL(href, window.location.origin)
        if (nextUrl.origin !== window.location.origin) return

        const currentFull = window.location.pathname + window.location.search
        const nextFull = nextUrl.pathname + nextUrl.search

        if (currentFull === nextFull) return

        setLoading(true)
        setProgress(25)
      } catch {}
    }

    document.addEventListener('click', handleAnchorClick, true)
    return () => document.removeEventListener('click', handleAnchorClick, true)
  }, [])

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev
        return prev + (90 - prev) * 0.18
      })
    }, 180)
    return () => clearInterval(interval)
  }, [loading])

  if (!loading && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      dir={dir}
      className="pointer-events-none fixed inset-x-0 top-0 z-[99999] flex h-[3px] justify-start overflow-hidden bg-transparent"
    >
      <div
        style={{ width: `${progress}%` }}
        className={`h-full shadow-[0_0_10px_rgba(37,99,235,0.65)] transition-all duration-200 ease-out ${
          dir === 'rtl'
            ? 'bg-gradient-to-l from-[#2563eb] via-[#007a5a] to-[#ff6437]'
            : 'bg-gradient-to-r from-[#2563eb] via-[#007a5a] to-[#ff6437]'
        }`}
      />
    </div>
  )
}