"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { fetchPostLoginPath } from "@/lib/post-login-path"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session) {
      router.push(await fetchPostLoginPath())
      router.refresh()
      return
    }

    setInfo(
      "確認メールを送信しました。メール内のリンクから登録を完了してください。"
    )
  }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">新規登録</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        メールアドレスとパスワード（6文字以上）でアカウントを作成します。
      </p>

      <Card size="sm">
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="signup-email" className="text-sm">
                メールアドレス
              </label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="signup-password" className="text-sm">
                パスワード
              </label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
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

            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "登録中…" : "アカウントを作成"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-foreground underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
