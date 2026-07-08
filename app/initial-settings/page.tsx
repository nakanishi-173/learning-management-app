"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

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

type Language = {
  programming_language_id: number
  programming_language_name: string
}

type GoalInput = {
  period: string
  goal: string
}

export default function Home() {
  const [languages, setLanguages] = useState<Language[]>([])

useEffect(() => {
  const fetchLanguages = async () => {
    const { data, error } = await supabase
    .from("プログラミング言語テーブル")
    .select("programming_language_id, programming_language_name")
    .order("programming_language_id")

    if (error) {
      console.error(error)
      return
    }
    setLanguages(data ?? [])
  }
  fetchLanguages()
}, [])

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  const [language, setLanguage] = useState("")
  const [goals, setGoals] = useState<GoalInput[]>([
    { period: "", goal: ""},
  ])
  const [weekdayHour, setWeekdayHour] = useState("")
  const [weekdayMinute, setWeekdayMinute] = useState("")
  const [holidayHour, setHolidayHour] = useState("")
  const [holidayMinute, setHolidayMinute] = useState("")

  const handleRegister = async() => {
    const userId = "11111111-1111-1111-1111-111111111111"

    const hasEmptyGoal = goals.some((g) => !g.period || !g.goal)

    if (!language || hasEmptyGoal || !weekdayHour || !weekdayMinute || !holidayHour || !holidayMinute) {
      alert("未入力の項目があります")
      return
    }

    const goalTypeMap: Record<string, number> = {
      short: 1,
      medium: 2,
      meddium: 2,
      long: 3,
    }

    const hasInvalidPeriod = goals.some((g) => !goalTypeMap[g.period])
    if (hasInvalidPeriod) {
      alert("目標期間区分が不正です")
      return
    }

    const { error: initialError } = await supabase
      .from("初期設定テーブル")
      .upsert({
        user_id: userId,
        programming_language_id: Number(language),
        weekday_hours: Number(weekdayHour),
        weekday_minutes: Number(weekdayMinute),
        holiday_hours: Number(holidayHour),
        holiday_minutes: Number(holidayMinute),
        updated_at: new Date().toISOString(),
      })

      if(initialError){
        alert("初期設定の保存に失敗しました: " + initialError.message)
        return
      }

      const goalRows = goals.map((g) => ({
        user_id: userId,
        goal_type: goalTypeMap[g.period],
        goal_title: g.goal,
        updated_at: new Date().toISOString(),
      }))

      const { error: goalError } = await supabase
      .from("ユーザー別目標設定テーブル") 
      .insert(goalRows)

      if (goalError) {
        alert("目標設定の保存に失敗しました: " + goalError.message)
        return
      }
      alert("登録しました")
    }

  const handleAddGoal = () => {
      setGoals([...goals, { period: "", goal: ""}])
    }
  
  const updateGoal = (index: number, field: "period" | "goal", value: string) => {
      setGoals(
        goals.map((g, i) =>
          i === index ? { ...g, [field]: value } : g
        )
      )
    }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
        <h2 className="text-base font-medium">目標設定</h2>
          <p className="text-sm text-muted-foreground mb-6">
            プログラミング言語学習における目標を設定してください。
          </p>

        <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
        <Card size="sm">
        <CardContent>
          <p>学習言語</p>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="言語を選択してください" />
            </SelectTrigger>
            <SelectContent >
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

        
        <Card size="sm">
        <CardContent className="flex flex-col gap-6">
          {goals.map((goalItem, index) => (
            <div key={index} className="flex flex-col gap-3">
              <p>目標 {index + 1}</p>

          <p>目標期間区分選択</p>
            <Select 
             value={goalItem.period} 
             onValueChange={(value) => updateGoal(index, "period", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="期間区分を選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">短期</SelectItem>
              <SelectItem value="meddium">中期</SelectItem>
              <SelectItem value="long">長期</SelectItem>
            </SelectContent>
            </Select>

          <p>目標</p>
          <Input 
             placeholder="達成したい目標"
             value={goalItem.goal}
             onChange={(e) => updateGoal(index, "goal", e.target.value)} 
           />
          </div>
          ))}

        <div className="flex justify-end">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={handleAddGoal}
        >
          +追加
        </Button>
        </div>
        </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
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
        </div>

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
        </CardContent>

        <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" onClick={handleRegister}>
          登録
        </Button>
        </CardFooter>

    </div>
  )
}

