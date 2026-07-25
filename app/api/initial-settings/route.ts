import { requireUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const [languages, setting] = await Promise.all([
      prisma.programmingLanguage.findMany({
        orderBy: { programming_language_id: "asc" },
        select: {
          programming_language_id: true,
          programming_language_name: true,
        },
      }),
      prisma.initialSetting.findUnique({
        where: { user_id: userId },
        include: {
          userGoals: {
            orderBy: { goal_id: "asc" },
          },
        },
      }),
    ])

    return NextResponse.json({
      languages,
      setting: setting
        ? {
            programming_language_id: setting.programming_language_id,
            weekday_hours: setting.weekday_hours,
            weekday_minutes: setting.weekday_minutes,
            holiday_hours: setting.holiday_hours,
            holiday_minutes: setting.holiday_minutes,
            goals: setting.userGoals.map((goal) => ({
              goal_id: goal.goal_id,
              goal_type: goal.goal_type,
              goal_title: goal.goal_title,
            })),
          }
        : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "初期設定の取得に失敗しました" },
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
      programming_language_id,
      weekday_hours,
      weekday_minutes,
      holiday_hours,
      holiday_minutes,
      goals,
    } = body

    if (
      !programming_language_id ||
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
      (goal: { goal_type?: number; goal_title?: string }) =>
        !goal.goal_type || !goal.goal_title?.trim()
    )

    if (hasInvalidGoal) {
      return NextResponse.json(
        { error: "未入力の項目があります" },
        { status: 400 }
      )
    }

    const goalRows = goals.map(
      (goal: { goal_type: number; goal_title: string }) => ({
        user_id: userId,
        goal_type: Number(goal.goal_type),
        goal_title: goal.goal_title.trim(),
      })
    )

    await prisma.$transaction(async (tx) => {
      await tx.initialSetting.upsert({
        where: { user_id: userId },
        update: {
          programming_language_id: Number(programming_language_id),
          weekday_hours: Number(weekday_hours),
          weekday_minutes: Number(weekday_minutes),
          holiday_hours: Number(holiday_hours),
          holiday_minutes: Number(holiday_minutes),
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          programming_language_id: Number(programming_language_id),
          weekday_hours: Number(weekday_hours),
          weekday_minutes: Number(weekday_minutes),
          holiday_hours: Number(holiday_hours),
          holiday_minutes: Number(holiday_minutes),
        },
      })

      await tx.userGoal.deleteMany({
        where: { user_id: userId },
      })

      await tx.userGoal.createMany({
        data: goalRows,
      })
    })

    return NextResponse.json({ message: "登録しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "初期設定の保存に失敗しました" },
      { status: 500 }
    )
  }
}