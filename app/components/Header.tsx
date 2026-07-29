"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/study-record-input", label: "学習記録入力" },
  { href: "/goal-settings", label: "目標入力" },
  { href: "/reflection", label: "振り返り" },
  { href: "/progress", label: "学習進捗グラフ・カレンダー" },
] as const

const AUTH_ROUTES = ["/login", "/signup"]

export const Header = () => {
  const pathname = usePathname()
  const router = useRouter()
  const showLogout = !AUTH_ROUTES.includes(pathname)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="mx-auto max-w-md md:max-w-lg lg:max-w-xl bg-slate-800 p-1 text-white">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-slate-700 hover:text-white"
              aria-label="メニューを開く"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4">
              {navItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                      pathname === item.href && "bg-muted font-medium"
                    )}
                  >
                    {item.label}
                    {"comingSoon" in item && item.comingSoon ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        （準備中）
                      </span>
                    ) : null}
                  </Link>
                </SheetClose>
              ))}
              {showLogout ? (
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={handleLogout}
                  >
                    ログアウト
                  </Button>
                </SheetClose>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-sm font-medium sm:text-base">
          プログラミング言語学習管理アプリ
        </h1>
      </div>
    </header>
  )
}
