import { requireUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const goalSetting = await prisma.goalSetting.findUnique({
      where: { user_id: userId },
      include: {
        userGoalContents: {
          orderBy: { goal_id: "asc" },
        },
      },
    })

    if (goalSetting) {
      return NextResponse.json({
        source: "saved",
        weekday_hours: goalSetting.weekday_hours,
        weekday_minutes: goalSetting.weekday_minutes,
        holiday_hours: goalSetting.holiday_hours,
        holiday_minutes: goalSetting.holiday_minutes,
        memo: goalSetting.memo,
        goals: goalSetting.userGoalContents.map((goal) => ({
          goal_id: goal.goal_id,
          goal_type: goal.goal_type,
          goal_title: goal.goal_title,
          goal_subject: goal.goal_subject,
          is_completed: goal.is_completed,
        })),
      })
    }

    const initialSetting = await prisma.initialSetting.findUnique({
      where: { user_id: userId },
      include: {
        userGoals: {
          orderBy: { goal_id: "asc" },
        },
      },
    })

    if (!initialSetting) {
      return NextResponse.json({
        source: "empty",
        weekday_hours: null,
        weekday_minutes: null,
        holiday_hours: null,
        holiday_minutes: null,
        memo: null,
        goals: [],
      })
    }

    return NextResponse.json({
      source: "initial",
      weekday_hours: initialSetting.weekday_hours,
      weekday_minutes: initialSetting.weekday_minutes,
      holiday_hours: initialSetting.holiday_hours,
      holiday_minutes: initialSetting.holiday_minutes,
      memo: null,
      goals: initialSetting.userGoals.map((goal) => ({
        goal_id: goal.goal_id,
        goal_type: goal.goal_type,
        goal_title: goal.goal_title,
        goal_subject: "",
        is_completed: false,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "目標入力の取得に失敗しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const body = await request.json()

    const {
      weekday_hours,
      weekday_minutes,
      holiday_hours,
      holiday_minutes,
      memo,
      goals,
    } = body

    if (
      weekday_hours === undefined ||
      weekday_hours === "" ||
      weekday_minutes === undefined ||
      weekday_minutes === "" ||
      holiday_hours === undefined ||
      holiday_hours === "" ||
      holiday_minutes === undefined ||
      holiday_minutes === "" ||
      !Array.isArray(goals) ||
      goals.length === 0
    ) {
      return NextResponse.json(
        { error: "未入力の項目があります" },
        { status: 400 }
      )
    }

    const hasInvalidGoal = goals.some(
      (goal: {
        goal_type?: number
        goal_title?: string
        goal_subject?: string
      }) =>
        !goal.goal_type ||
        !goal.goal_title?.trim() ||
        !goal.goal_subject?.trim()
    )

    if (hasInvalidGoal) {
      return NextResponse.json(
        { error: "未入力の項目があります" },
        { status: 400 }
      )
    }

    const goalRows = goals.map(
      (
        goal: {
          goal_type: number
          goal_title: string
          goal_subject: string
          is_completed?: boolean
        },
        index: number
      ) => ({
        user_id: userId,
        goal_id: index + 1,
        goal_type: Number(goal.goal_type),
        goal_title: goal.goal_title.trim(),
        goal_subject: goal.goal_subject.trim(),
        is_completed: goal.is_completed ?? false,
      })
    )

    await prisma.$transaction(async (tx) => {
      await tx.goalSetting.upsert({
        where: { user_id: userId },
        update: {
          weekday_hours: Number(weekday_hours),
          weekday_minutes: Number(weekday_minutes),
          holiday_hours: Number(holiday_hours),
          holiday_minutes: Number(holiday_minutes),
          memo: memo?.trim() ? memo.trim() : null,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          weekday_hours: Number(weekday_hours),
          weekday_minutes: Number(weekday_minutes),
          holiday_hours: Number(holiday_hours),
          holiday_minutes: Number(holiday_minutes),
          memo: memo?.trim() ? memo.trim() : null,
        },
      })

      await tx.userGoalContent.deleteMany({
        where: { user_id: userId },
      })

      await tx.userGoalContent.createMany({
        data: goalRows,
      })
    })

    return NextResponse.json({ message: "登録しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "目標入力の保存に失敗しました" },
      { status: 500 }
    )
  }
}
