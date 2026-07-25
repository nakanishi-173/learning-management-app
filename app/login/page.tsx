"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { fetchPostLoginPath } from "@/lib/post-login-path"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError("メールアドレスまたはパスワードが正しくありません。")
      return
    }

    router.push(await fetchPostLoginPath())
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">ログイン</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        登録済みのメールアドレスとパスワードでログインしてください。
      </p>

      <Card size="sm">
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-sm">
                メールアドレス
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-sm">
                パスワード
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "ログイン中…" : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-foreground underline">
          新規登録
        </Link>
      </p>
    </div>
  )
}
