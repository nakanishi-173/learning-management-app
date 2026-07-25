"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const SKIP_PATHS = ["/login", "/signup", "/initial-settings"]

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (SKIP_PATHS.includes(pathname)) return

    const controller = new AbortController()

    const check = async () => {
      const res = await fetch("/api/initial-settings", {
        signal: controller.signal,
      })
      if (!res.ok) return

      const data = (await res.json()) as { setting: unknown | null }
      if (!data.setting) {
        router.replace("/initial-settings")
      }
    }

    check()
    return () => controller.abort()
  }, [pathname, router])

  return children
}
