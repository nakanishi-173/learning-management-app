"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { shiftDateString, toDateString } from "@/lib/date"

// グラフの期間モード
type PeriodMode = "7" | "30" | "90" | "custom"

// API から返る1日分のデータ
type ChartDay = {
  study_date: string
  study_hours: number
  study_minutes: number
  total_minutes: number
}

// 折れ線グラフ用に整形した1日分のデータ
type ChartPoint = {
  study_date: string
  label: string
  total_minutes: number
}

const chartConfig = {
  total_minutes: {
    label: "学習時間",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

// 期間切替ボタンの選択肢
const periodOptions: { value: PeriodMode; label: string }[] = [
  { value: "7", label: "7日間" },
  { value: "30", label: "30日間" },
  { value: "90", label: "90日間" },
  { value: "custom", label: "期間カスタム" },
]

// 分を「X時間Y分」形式に変換（ツールチップ用）
function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}分`
  if (minutes === 0) return `${hours}時間`
  return `${hours}時間${minutes}分`
}

// X 軸ラベル用（7/10 形式）
function formatAxisLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-")
  return `${Number(month)}/${Number(day)}`
}

// ツールチップ用（2026年7月10日 形式）
function formatDetailDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${year}年${Number(month)}月${Number(day)}日`
}

// 期間モードに応じて from / to を計算する
function getRange(
  mode: PeriodMode,
  customFrom: string,
  customTo: string
): { from: string; to: string } {
  const today = toDateString(new Date())
  switch (mode) {
    case "7":
      return { from: shiftDateString(today, -6), to: today }
    case "30":
      return { from: shiftDateString(today, -29), to: today }
    case "90":
      return { from: shiftDateString(today, -89), to: today }
    case "custom":
      return { from: customFrom, to: customTo }
  }
}

export function StudyTimeChart() {
  const today = toDateString(new Date())

  // 画面上の入力値・取得結果を保持する
  const [mode, setMode] = useState<PeriodMode>("7")
  const [customFrom, setCustomFrom] = useState(shiftDateString(today, -6))
  const [customTo, setCustomTo] = useState(today)
  const [days, setDays] = useState<ChartDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const range = useMemo(
    () => getRange(mode, customFrom, customTo),
    [mode, customFrom, customTo]
  )

  // 期間が変わったときにグラフ API から日別データを取得する
  useEffect(() => {
    const controller = new AbortController()

    const fetchChart = async () => {
      if (mode === "custom" && (!customFrom || !customTo)) {
        setDays([])
        return
      }

      setIsLoading(true)
      setError("")
      try {
        const res = await fetch(
          `/api/progress/chart?from=${range.from}&to=${range.to}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? "グラフ情報の取得に失敗しました")
          setDays([])
          return
        }
        const json = await res.json()
        setDays(json.days ?? [])
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        console.error(err)
        setError("グラフ情報の取得に失敗しました")
        setDays([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChart()
    return () => controller.abort()
  }, [mode, customFrom, customTo, range.from, range.to])

  // Recharts 用にデータを整形
  const chartData: ChartPoint[] = useMemo(
    () =>
      days.map((day) => ({
        study_date: day.study_date,
        label: formatAxisLabel(day.study_date),
        total_minutes: day.total_minutes,
      })),
    [days]
  )

  // 日数が多いときは X 軸の目盛りを間引く
  const tickInterval =
    chartData.length > 14 ? Math.max(1, Math.floor(chartData.length / 7)) : 0

  return (
    <Card size="sm">
      <CardContent>
        <p className="mb-3 text-sm font-medium">日別学習時間</p>

        {/* 期間切替（7日 / 30日 / 90日 / カスタム） */}
        <div className="mb-4 flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={mode === option.value ? "default" : "outline"}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* カスタム期間の開始日・終了日 */}
        {mode === "custom" && (
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">〜</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-40"
            />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            表示できるデータがありません。
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={tickInterval}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as ChartPoint | undefined
                      return item ? formatDetailDate(item.study_date) : ""
                    }}
                    formatter={(value) => formatMinutes(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="total_minutes"
                stroke="var(--color-total_minutes)"
                strokeWidth={2}
                dot={chartData.length <= 31}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
