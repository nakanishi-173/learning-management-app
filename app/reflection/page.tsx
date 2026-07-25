"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"

const start_year = 2026
const end_year = 2030
const years = Array.from(
  { length: end_year - start_year + 1 },
  (_, i) => start_year + i
)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

type ReflectionView = {
  study_days: number
  study_hours: number
  study_minutes: number
  study_content: string | null
  challenge: string | null
  improvement: string | null
  memo: string | null
}

const emptyView: ReflectionView = {
  study_days: 0,
  study_hours: 0,
  study_minutes: 0,
  study_content: null,
  challenge: null,
  improvement: null,
  memo: null,
}

function getDefaultYear(): string {
  const year = new Date().getFullYear()
  if (year < start_year) return String(start_year)
  if (year > end_year) return String(end_year)
  return String(year)
}

function getDefaultMonth(): string {
  return String(new Date().getMonth() + 1)
}

function DisplayField({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <p className="mb-1.5 text-sm text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value?.trim() ? value : "未登録"}
      </p>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [year, setYear] = useState(getDefaultYear)
  const [month, setMonth] = useState(getDefaultMonth)
  const [view, setView] = useState<ReflectionView>(emptyView)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!year || !month) return

    const controller = new AbortController()
    const fetchReflection = async () => {
      setIsLoading(true)
      setError("")
      try {
        const res = await fetch(
          `/api/monthly-summary?study_year=${year}&study_month=${month}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? "振り返りの取得に失敗しました")
          setView(emptyView)
          return
        }
        const data = await res.json()
        setView({
          study_days: data.study_days ?? 0,
          study_hours: data.study_hours ?? 0,
          study_minutes: data.study_minutes ?? 0,
          study_content: data.study_content ?? null,
          challenge: data.challenge ?? null,
          improvement: data.improvement ?? null,
          memo: data.memo ?? null,
        })
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        console.error(err)
        setError("振り返りの取得に失敗しました")
        setView(emptyView)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReflection()
    return () => controller.abort()
  }, [year, month])

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">月別の学習状況</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        年月を選択すると、その月の学習記録と振り返りが表示されます。
      </p>

      <div className="flex flex-col gap-6">
        <Card size="sm">
          <CardContent>
            <p className="mb-1.5 text-sm text-muted-foreground">
              年月選択
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue placeholder="年" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>年</span>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue placeholder="月" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>月</span>
            </div>

            <div className="my-6 flex flex-col gap-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <>
                  <div className="rounded-lg border border-border px-3 py-3">
                    <p className="mb-1.5 text-sm text-muted-foreground">
                      学習日数
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {view.study_days}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        日
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border px-3 py-3">
                    <p className="mb-1.5 text-sm text-muted-foreground">
                      学習時間
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {view.study_hours}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        時間
                      </span>{" "}
                      {view.study_minutes}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        分
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {!isLoading && !error && (
              <div className="flex flex-col gap-3">
                <DisplayField
                  label="主に学習した内容"
                  value={view.study_content}
                />
                <DisplayField label="課題" value={view.challenge} />
                <DisplayField label="改善案" value={view.improvement} />
                <DisplayField label="メモ" value={view.memo} />
              </div>
            )}
          </CardContent>
          <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push("/reflection-input")}
            >
              振り返り入力
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
