"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return <Button variant="ghost" size="icon" className={className} onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}>{dark ? <Sun /> : <Moon />}</Button>
}
