"use client"

import { useEffect, useMemo, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toDateString } from "@/lib/date"

// 年の選択範囲（2026〜2030）
const startYear = 2026
const endYear = 2030
// Select 用の年・月の選択肢
const years = Array.from(
  { length: endYear - startYear + 1 },
  (_, i) => startYear + i
)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

// カレンダー API から返る1日分のデータ
type CalendarRecord = {
  study_date: string
  study_hours: number
  study_minutes: number
  total_minutes: number
}

function getDefaultYear(): string {
  const year = new Date().getFullYear()
  if (year < startYear) return String(startYear)
  if (year > endYear) return String(endYear)
  return String(year)
}

function getDefaultMonth(): string {
  return String(new Date().getMonth() + 1)
}

// YYYY-MM-DD 文字列を Date に変換（カレンダー選択用）
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

type StudyCalendarProps = {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  embedded?: boolean
}

export function StudyCalendar({
  selectedDate,
  onSelectDate,
  embedded = false,
}: StudyCalendarProps) {
  // 画面上の入力値・取得結果を保持する
  const [year, setYear] = useState(getDefaultYear)
  const [month, setMonth] = useState(getDefaultMonth)
  const [records, setRecords] = useState<CalendarRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 年月が変わったときにカレンダー API から学習記録がある日を取得する
  useEffect(() => {
    if (!year || !month) return

    const controller = new AbortController()

    const fetchCalendar = async () => {
      setIsLoading(true)
      setError("")
      try {
        const res = await fetch(
          `/api/progress/calendar?study_year=${year}&study_month=${month}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? "カレンダー情報の取得に失敗しました")
          setRecords([])
          return
        }
        const json = await res.json()
        setRecords(json.records ?? [])
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        console.error(err)
        setError("カレンダー情報の取得に失敗しました")
        setRecords([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendar()
    return () => controller.abort()
  }, [year, month])

  // 学習記録がある日付の Set（カレンダーのハイライト用）
  const recordDates = useMemo(
    () => new Set(records.map((record) => record.study_date)),
    [records]
  )

  const calendarMonth = useMemo(
    () => new Date(Number(year), Number(month) - 1, 1),
    [year, month]
  )

  const selected = selectedDate ? parseDateString(selectedDate) : undefined

  const content = (
    <>
      {/* 入力年月選択 */}
      <p className="mb-1.5 text-sm text-muted-foreground">年月選択</p>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
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

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">読み込み中...</p>
      ) : error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {/* 月カレンダー（学習した日はドット表示、クリックで詳細へ） */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onSelectDate(toDateString(date))
            }
          }}
          month={calendarMonth}
          onMonthChange={(date) => {
            setYear(String(date.getFullYear()))
            setMonth(String(date.getMonth() + 1))
          }}
          modifiers={{
            studied: (date) => recordDates.has(toDateString(date)),
          }}
          modifiersClassNames={{
            studied:
              "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
          }}
          className="rounded-lg border border-border"
        />
      </div>
    </>
  )

  // progress ページでは Card なしで埋め込む
  if (embedded) {
    return content
  }

  return (
    <Card size="sm">
      <CardContent>{content}</CardContent>
    </Card>
  )
}
