import { requireUserId } from "@/lib/auth"
import { formatDbDate, getMonthRange } from "@/lib/date"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

    const records = await prisma.studyRecord.findMany({
      where: {
        user_id: userId,
        study_date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        study_date: true,
        study_hours: true,
        study_minutes: true,
      },
      orderBy: { study_date: "asc" },
    })

    const formattedRecords = records.map((record) => {
      const totalMinutes = record.study_hours * 60 + record.study_minutes
      return {
        study_date: formatDbDate(record.study_date),
        study_hours: record.study_hours,
        study_minutes: record.study_minutes,
        total_minutes: totalMinutes,
      }
    })

    return NextResponse.json({
      study_year: year,
      study_month: month,
      records: formattedRecords,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "カレンダー情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}
