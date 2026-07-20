"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { StudyStreak } from "@/app/components/dashboard/StudyStreak"
import { TodayStudyTime } from "@/app/components/dashboard/TodayStudyTime"
import { GoalProgressBar } from "@/app/components/dashboard/GoalProgressBar"
import {
  TodayTasks,
  type DashboardTask,
} from "@/app/components/dashboard/TodayTasks"

type DashboardData = {
  streak_days: number
  today_study_hours: number
  today_study_minutes: number
  progress_percent: number
  target_hours: number
  target_minutes: number
  tasks: DashboardTask[]
}

export default function Home() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard", {
          signal: controller.signal,
        })
        if (!res.ok) {
          console.error("ダッシュボード情報の取得に失敗しました")
          return
        }
        const json = (await res.json()) as DashboardData
        setData(json)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error(error)
      }
    }

    fetchDashboard()
    return () => {
      controller.abort()
    }
  }, [])

  const handleToggleTask = async (
    taskId: number,
    isCompleted: boolean
  ) => {
    if (!data || isUpdatingTask) return

    const previousTasks = data.tasks
    setData({
      ...data,
      tasks: data.tasks.map((task) =>
        task.study_task_id === taskId
          ? { ...task, is_completed: isCompleted }
          : task
      ),
    })
    setIsUpdatingTask(true)

    try {
      const res = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_task_id: taskId,
          is_completed: isCompleted,
        }),
      })
      if (!res.ok) {
        setData({ ...data, tasks: previousTasks })
        const { error } = await res.json()
        console.error(error ?? "タスクの更新に失敗しました")
      }
    } catch (error) {
      setData({ ...data, tasks: previousTasks })
      console.error(error)
    } finally {
      setIsUpdatingTask(false)
    }
  }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">ダッシュボード</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        今日の学習状況を確認しましょう。
      </p>

      {!data ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <StudyStreak days={data.streak_days} />
          <TodayStudyTime
            hours={data.today_study_hours}
            minutes={data.today_study_minutes}
          />
          <GoalProgressBar
            percent={data.progress_percent}
            targetHours={data.target_hours}
            targetMinutes={data.target_minutes}
          />
          <TodayTasks
            tasks={data.tasks}
            onToggle={handleToggleTask}
            isUpdating={isUpdatingTask}
          />
          <div className="flex justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push("/study-record-input")}
            >
              学習記録を入力
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
