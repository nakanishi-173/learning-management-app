import { requireUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function getMonthRange(year: number, month: number) {
  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01`
  )
  const endYear = month === 12 ? year + 1 : year
  const endMonth = month === 12 ? 1 : month + 1
  const end = new Date(
    `${endYear}-${String(endMonth).padStart(2, "0")}-01`
  )
  return { start, end }
}

export async function GET(request: Request) {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const { searchParams } = new URL(request.url)
    const studyYear = searchParams.get("study_year")
    const studyMonth = searchParams.get("study_month")

    if (!studyYear || !studyMonth) {
      return NextResponse.json(
        { error: "年月が指定されていません" },
        { status: 400 }
      )
    }

    const year = Number(studyYear)
    const month = Number(studyMonth)

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

    const [studyRecords, reflection] = await Promise.all([
      prisma.studyRecord.findMany({
        where: {
          user_id: userId,
          study_date: {
            gte: start,
            lt: end,
          },
        },
        select: {
          study_hours: true,
          study_minutes: true,
        },
      }),
      prisma.reflection.findUnique({
        where: {
          user_id_study_year_study_month: {
            user_id: userId,
            study_year: year,
            study_month: month,
          },
        },
      }),
    ])

    const totalMinutes = studyRecords.reduce(
      (sum, record) =>
        sum + record.study_hours * 60 + record.study_minutes,
      0
    )

    return NextResponse.json({
      study_days: studyRecords.length,
      study_hours: Math.floor(totalMinutes / 60),
      study_minutes: totalMinutes % 60,
      study_content: reflection?.study_content ?? null,
      challenge: reflection?.challenge ?? null,
      improvement: reflection?.improvement ?? null,
      memo: reflection?.memo ?? null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "振り返りの取得に失敗しました" },
      { status: 500 }
    )
  }
}
