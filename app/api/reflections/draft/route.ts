import { requireUserId } from "@/lib/auth"
import { formatDbDate, getMonthRange } from "@/lib/date"
import { generateReflectionDraft } from "@/lib/llm/generate-reflection-draft"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const body = await request.json()
    const { study_year, study_month } = body

    if (!study_year || !study_month) {
      return NextResponse.json(
        { error: "年月が指定されていません" },
        { status: 400 }
      )
    }

    const year = Number(study_year)
    const month = Number(study_month)

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        { error: "年月の形式が正しくありません" },
        { status: 400 }
      )
    }

    const { start, end } = getMonthRange(year, month)

    const studyRecords = await prisma.studyRecord.findMany({
      where: {
        user_id: userId,
        study_date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        studyTasks: {
          orderBy: { study_task_id: "asc" },
        },
      },
      orderBy: { study_date: "asc" },
    })

    if (studyRecords.length === 0) {
      return NextResponse.json(
        { error: "学習記録がありません" },
        { status: 400 }
      )
    }

    const draft = await generateReflectionDraft({
      year,
      month,
      studyRecords: studyRecords.map((record) => ({
        studyDate: formatDbDate(record.study_date),
        subject: record.subject,
        studyHours: record.study_hours,
        studyMinutes: record.study_minutes,
        memo: record.memo,
        tasks: record.studyTasks.map((task) => task.study_task),
      })),
    })

    return NextResponse.json(draft)
  } catch (error) {
    console.error(error)

    if (error instanceof Error) {
      if (error.message === "学習記録がありません") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message === "OPENAI_API_KEY が設定されていません") {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json(
      { error: "下書きの生成に失敗しました" },
      { status: 500 }
    )
  }
}
