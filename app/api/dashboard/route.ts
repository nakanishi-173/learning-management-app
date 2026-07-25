import { requireUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDbDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function shiftDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

function calcStreak(studyDates: Set<string>): number {
  const today = toDateString(new Date())
  let cursor = today

  if (!studyDates.has(today)) {
    const yesterday = shiftDateString(today, -1)
    if (!studyDates.has(yesterday)) {
      return 0
    }
    cursor = yesterday
  }

  let streak = 0
  while (studyDates.has(cursor)) {
    streak += 1
    cursor = shiftDateString(cursor, -1)
  }
  return streak
}

export async function GET() {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const today = toDateString(new Date())
    const todayDate = new Date(today)
    const dayOfWeek = new Date(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)) - 1,
      Number(today.slice(8, 10))
    ).getDay()
    const isHoliday = dayOfWeek === 0 || dayOfWeek === 6

    const [studyRecords, todayRecord, goalSetting, initialSetting] =
      await Promise.all([
        prisma.studyRecord.findMany({
          where: { user_id: userId },
          select: { study_date: true },
          orderBy: { study_date: "desc" },
        }),
        prisma.studyRecord.findUnique({
          where: {
            user_id_study_date: {
              user_id: userId,
              study_date: todayDate,
            },
          },
          include: {
            studyTasks: {
              orderBy: { study_task_id: "asc" },
            },
          },
        }),
        prisma.goalSetting.findUnique({
          where: { user_id: userId },
        }),
        prisma.initialSetting.findUnique({
          where: { user_id: userId },
        }),
      ])

    const studyDates = new Set(
      studyRecords.map((record) => formatDbDate(record.study_date))
    )
    const streakDays = calcStreak(studyDates)

    const studyHours = todayRecord?.study_hours ?? 0
    const studyMinutes = todayRecord?.study_minutes ?? 0
    const studiedTotalMinutes = studyHours * 60 + studyMinutes

    const timeSource = goalSetting ?? initialSetting
    const targetHours = timeSource
      ? isHoliday
        ? timeSource.holiday_hours
        : timeSource.weekday_hours
      : 0
    const targetMinutes = timeSource
      ? isHoliday
        ? timeSource.holiday_minutes
        : timeSource.weekday_minutes
      : 0
    const targetTotalMinutes = targetHours * 60 + targetMinutes

    const progressPercent =
      targetTotalMinutes === 0
        ? 0
        : Math.min(
            100,
            Math.round((studiedTotalMinutes / targetTotalMinutes) * 100)
          )

    return NextResponse.json({
      streak_days: streakDays,
      today_study_hours: studyHours,
      today_study_minutes: studyMinutes,
      progress_percent: progressPercent,
      target_hours: targetHours,
      target_minutes: targetMinutes,
      tasks:
        todayRecord?.studyTasks.map((task) => ({
          study_task_id: task.study_task_id,
          study_task: task.study_task,
          is_completed: task.is_completed,
        })) ?? [],
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const body = await request.json()
    const { study_task_id, is_completed } = body

    if (
      study_task_id === undefined ||
      study_task_id === null ||
      typeof is_completed !== "boolean"
    ) {
      return NextResponse.json(
        { error: "タスク情報が不正です" },
        { status: 400 }
      )
    }

    const today = toDateString(new Date())
    const todayDate = new Date(today)

    const existing = await prisma.studyTask.findUnique({
      where: {
        user_id_study_date_study_task_id: {
          user_id: userId,
          study_date: todayDate,
          study_task_id: Number(study_task_id),
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "タスクが見つかりません" },
        { status: 404 }
      )
    }

    await prisma.studyTask.update({
      where: {
        user_id_study_date_study_task_id: {
          user_id: userId,
          study_date: todayDate,
          study_task_id: Number(study_task_id),
        },
      },
      data: {
        is_completed,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ message: "更新しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "タスクの更新に失敗しました" },
      { status: 500 }
    )
  }
}
