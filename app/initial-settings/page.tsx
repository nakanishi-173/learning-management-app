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

// 言語1件のデータはid（数字）とname（文字）の2つのプロパティを持つ
type Language = {
  programming_language_id: number
  programming_language_name: string
}

// 目標期間区分
type Period = "short" | "medium" | "long"

// 目標1件のデータはid（数字）とtitle（文字）の2つのプロパティを持つ
type GoalInput = {
  id: string
  title: string
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
})

// 各目標期間区分に空の入力欄を入れる
const emptyGoalsByPeriod = (): GoalsByPeriod => ({
  short: [emptyGoal()],
  medium: [emptyGoal()],
  long: [emptyGoal()],
})

export default function Home() {
// 画面上の入力値を保持する
  const [languages, setLanguages] = useState<Language[]>([])
  const [language, setLanguage] = useState("")
  const [goalsByPeriod, setGoalsByPeriod] =
    useState<GoalsByPeriod>(emptyGoalsByPeriod)
  const [weekdayHour, setWeekdayHour] = useState("")
  const [weekdayMinute, setWeekdayMinute] = useState("")
  const [holidayHour, setHolidayHour] = useState("")
  const [holidayMinute, setHolidayMinute] = useState("")

// Select用の時・分の選択肢
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

// 画面表示時に初期設定 API から言語・設定を取得してフォームに反映する
  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        const res = await fetch("/api/initial-settings")
        if (!res.ok) {
          console.error("初期設定の取得に失敗しました")
          return
        }

        const data = await res.json()
        setLanguages(data.languages ?? [])

        if (data.setting) {
          setLanguage(String(data.setting.programming_language_id))
          setWeekdayHour(String(data.setting.weekday_hours))
          setWeekdayMinute(String(data.setting.weekday_minutes))
          setHolidayHour(String(data.setting.holiday_hours))
          setHolidayMinute(String(data.setting.holiday_minutes))

          const next: GoalsByPeriod = {
            short: [],
            medium: [],
            long: [],
          }

          for (const g of data.setting.goals ?? []) {
            const period = PERIODS.find(
              (p) => p.goalType === g.goal_type
            )?.key
            if (!period) continue
            next[period].push({
              id: String(g.goal_id),
              title: g.goal_title,
            })
          }

          for (const { key } of PERIODS) {
            if (next[key].length === 0) next[key] = [emptyGoal()]
          }
          setGoalsByPeriod(next)
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchInitialSettings()
  }, [])

// 登録ボタン押下時: 送信用データを整え、入力チェック後に初期設定APIへPOSTする
  const handleRegister = async () => {
    const goals = PERIODS.flatMap(({ key, goalType }) =>
      goalsByPeriod[key]
        .filter((g) => g.title.trim())
        .map((g) => ({
          goal_type: goalType,
          goal_title: g.title.trim(),
        }))
    )

    if (
      !language ||
      goals.length === 0 ||
      !weekdayHour ||
      !weekdayMinute ||
      !holidayHour ||
      !holidayMinute
    ) {
      alert("未入力の項目があります")
      return
    }

    const res = await fetch("/api/initial-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programming_language_id: Number(language),
        weekday_hours: Number(weekdayHour),
        weekday_minutes: Number(weekdayMinute),
        holiday_hours: Number(holidayHour),
        holiday_minutes: Number(holidayMinute),
        goals,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? "初期設定の保存に失敗しました")
      return
    }

    alert("保存しました")
  }

// 目標の追加・更新・削除
  const addGoal = (period: Period) => {
    setGoalsByPeriod((prev) => ({
      ...prev,
      [period]: [...prev[period], emptyGoal()],
    }))
  }

  const updateGoalTitle = (period: Period, id: string, title: string) => {
    setGoalsByPeriod((prev) => ({
      ...prev,
      [period]: prev[period].map((g) =>
        g.id === id ? { ...g, title } : g
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

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">初期目標設定</h2>
      <p className="text-sm text-muted-foreground mb-6">
        プログラミング言語学習における目標を設定してください。
      </p>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">

         {/* 学習言語 */}
          <Card size="sm">
            <CardContent>
              <p>学習言語</p>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="言語を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.programming_language_id}
                      value={String(lang.programming_language_id)}
                    >
                      {lang.programming_language_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* 短期・中期・長期の目標入力 */}
        {PERIODS.map(({ key, label }) => (
          <Card key={key} size="sm">
            <CardContent className="flex flex-col gap-3">
              <p>{label}目標</p>

              {goalsByPeriod[key].map((g) => (
                <div key={g.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`${label}で達成したい目標`}
                    value={g.title}
                    onChange={(e) =>
                      updateGoalTitle(key, g.id, e.target.value)
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

        <div className="flex flex-col gap-6">

          {/* 平日の目標学習時間 */}
          <Card size="sm">
            <CardContent>
              <p>平日目標学習時間</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Select
                  value={weekdayHour}
                  onValueChange={setWeekdayHour}
                >
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
                <Select
                  value={weekdayMinute}
                  onValueChange={setWeekdayMinute}
                >
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
        </div>

        {/* 休日の目標学習時間 */}
        <Card size="sm">
          <CardContent>
            <p>休日目標学習時間</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select
                value={holidayHour}
                onValueChange={setHolidayHour}
              >
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
              <Select
                value={holidayMinute}
                onValueChange={setHolidayMinute}
              >
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
      </CardContent>

      {/* 保存ボタン */}
      <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" onClick={handleRegister}>
          保存
        </Button>
      </CardFooter>
    </div>
  )
}
