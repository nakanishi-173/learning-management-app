"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"

// 目標期間区分
type Period = "short" | "medium" | "long"

// 目標1件のデータはid・title・content・completedを持つ
type GoalInput = {
  id: string
  title: string
  content: string
  completed: boolean
}

// 各目標期間区分ごとに目標配列を持つ
type GoalsByPeriod = {
  short: GoalInput[]
  medium: GoalInput[]
  long: GoalInput[]
}

// 目標期間区分を番号で管理するための対応表
const PERIODS: { key: Period; label: string; goalType: number }[] = [
  { key: "short", label: "短期", goalType: 1 },
  { key: "medium", label: "中期", goalType: 2 },
  { key: "long", label: "長期", goalType: 3 },
]

// 空の目標を1件作成
const emptyGoal = (): GoalInput => ({
  id: crypto.randomUUID(),
  title: "",
  content: "",
  completed: false,
})

// 短期のみ空の入力欄を入れた初期状態
const emptyGoalsByPeriod = (): GoalsByPeriod => ({
  short: [emptyGoal()],
  medium: [],
  long: [],
})

export default function Home() {
// 画面上の入力値を保持する
  const [goalsByPeriod, setGoalsByPeriod] =
    useState<GoalsByPeriod>(emptyGoalsByPeriod)
  const [weekdayHour, setWeekdayHour] = useState("")
  const [weekdayMinute, setWeekdayMinute] = useState("")
  const [holidayHour, setHolidayHour] = useState("")
  const [holidayMinute, setHolidayMinute] = useState("")
  const [memo, setMemo] = useState("")
  const [isLoading, setIsLoading] = useState(true)

// Select用の時・分の選択肢
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

// 画面表示時に目標入力 API から設定を取得してフォームに反映する
  useEffect(() => {
    const fetchGoalSettings = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/goal-settings")
        if (!res.ok) {
          console.error("目標入力の取得に失敗しました")
          return
        }

        const data = await res.json()

        if (data.weekday_hours !== null && data.weekday_hours !== undefined) {
          setWeekdayHour(String(data.weekday_hours))
          setWeekdayMinute(String(data.weekday_minutes))
          setHolidayHour(String(data.holiday_hours))
          setHolidayMinute(String(data.holiday_minutes))
        }

        setMemo(data.memo ?? "")

        const next: GoalsByPeriod = {
          short: [],
          medium: [],
          long: [],
        }

        for (const g of data.goals ?? []) {
          const period = PERIODS.find((p) => p.goalType === g.goal_type)?.key
          if (!period) continue
          next[period].push({
            id: String(g.goal_id),
            title: g.goal_title,
            content: g.goal_subject ?? "",
            completed: g.is_completed ?? false,
          })
        }

        if (next.short.length === 0) next.short = [emptyGoal()]
        setGoalsByPeriod(next)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoalSettings()
  }, [])

// 目標の追加・更新・削除・完了切り替え
  const addGoal = (period: Period) => {
    setGoalsByPeriod((prev) => ({
      ...prev,
      [period]: [...prev[period], emptyGoal()],
    }))
  }

  const updateGoal = (
    period: Period,
    id: string,
    field: "title" | "content",
    value: string
  ) => {
    setGoalsByPeriod((prev) => ({
      ...prev,
      [period]: prev[period].map((g) =>
        g.id === id ? { ...g, [field]: value } : g
      ),
    }))
  }

  const toggleGoalCompleted = (
    period: Period,
    id: string,
    completed: boolean
  ) => {
    setGoalsByPeriod((prev) => ({
      ...prev,
      [period]: prev[period].map((g) =>
        g.id === id ? { ...g, completed } : g
      ),
    }))
  }

  const removeGoal = (period: Period, id: string) => {
    setGoalsByPeriod((prev) => {
      const nextList = prev[period].filter((g) => g.id !== id)
      if (period === "short" && nextList.length === 0) {
        return { ...prev, short: [emptyGoal()] }
      }
      return { ...prev, [period]: nextList }
    })
  }

// 登録ボタン押下時: 送信用データを整え、入力チェック後に目標入力APIへPOSTする
  const handleRegister = async () => {
    const goals = PERIODS.flatMap(({ key, goalType }) =>
      goalsByPeriod[key]
        .filter((g) => g.title.trim())
        .map((g) => ({
          goal_type: goalType,
          goal_title: g.title.trim(),
          goal_subject: g.content.trim(),
          is_completed: g.completed,
        }))
    )

    const hasMissingContent = goals.some((g) => !g.goal_subject)

    if (
      goals.length === 0 ||
      hasMissingContent ||
      !weekdayHour ||
      !weekdayMinute ||
      !holidayHour ||
      !holidayMinute
    ) {
      alert("未入力の項目があります")
      return
    }

    const res = await fetch("/api/goal-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goals,
        weekday_hours: Number(weekdayHour),
        weekday_minutes: Number(weekdayMinute),
        holiday_hours: Number(holidayHour),
        holiday_minutes: Number(holidayMinute),
        memo: memo.trim() || null,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? "目標入力の保存に失敗しました")
      return
    }

    alert("登録しました")
  }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">目標入力</h2>
      <p className="text-sm text-muted-foreground mb-6">
        プログラミング言語学習における目標を入力してください。
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
      <CardContent className="flex flex-col gap-6">
        {/* 短期・中期・長期の目標入力 */}
        {PERIODS.map(({ key, label }) => (
          <Card key={key} size="sm">
            <CardContent className="flex flex-col gap-3">
              <p>{label}目標</p>

              {goalsByPeriod[key].map((g) => (
                <div key={g.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={g.completed}
                      onChange={(e) =>
                        toggleGoalCompleted(key, g.id, e.target.checked)
                      }
                      className="size-4 shrink-0 rounded border border-input"
                    />
                    <Input
                      placeholder={`${label}で達成したい目標`}
                      value={g.title}
                      onChange={(e) =>
                        updateGoal(key, g.id, "title", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeGoal(key, g.id)}
                    >
                      削除
                    </Button>
                  </div>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                    placeholder={`${label}の目標内容`}
                    value={g.content}
                    onChange={(e) =>
                      updateGoal(key, g.id, "content", e.target.value)
                    }
                  />
                </div>
              ))}

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => addGoal(key)}
                >
                  + {label}を追加
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 平日の目標学習時間 */}
        <Card size="sm">
          <CardContent>
            <p>平日目標学習時間</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={weekdayHour} onValueChange={setWeekdayHour}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {String(hour).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>時</span>
              <Select value={weekdayMinute} onValueChange={setWeekdayMinute}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {String(minute).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>分</span>
            </div>
          </CardContent>
        </Card>

        {/* 休日の目標学習時間 */}
        <Card size="sm">
          <CardContent>
            <p>休日目標学習時間</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={holidayHour} onValueChange={setHolidayHour}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {String(hour).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>時</span>
              <Select value={holidayMinute} onValueChange={setHolidayMinute}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {String(minute).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>分</span>
            </div>
          </CardContent>
        </Card>

        {/* メモ（任意） */}
        <Card size="sm">
          <CardContent>
            <p>メモ（任意）</p>
            <textarea
              className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </CardContent>
        </Card>
      </CardContent>
      )}

      {/* 登録ボタン */}
      {!isLoading && (
      <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" onClick={handleRegister}>
          登録
        </Button>
      </CardFooter>
      )}
    </div>
  )
}
