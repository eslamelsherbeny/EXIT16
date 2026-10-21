'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import arDict from '@/dictionaries/ar.json'

const c = arDict.authPages.common

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? c.lightThemeAria : c.darkThemeAria}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
