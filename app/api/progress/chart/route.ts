import { requireUserId } from "@/lib/auth"
import {
  countDays,
  formatDbDate,
  shiftDateString,
} from "@/lib/date"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const MAX_RANGE_DAYS = 180
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  const auth = await requireUserId()
  if (!auth.ok) return auth.response
  const userId = auth.userId

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json(
        { error: "期間が指定されていません" },
        { status: 400 }
      )
    }

    if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
      return NextResponse.json(
        { error: "日付の形式が正しくありません" },
        { status: 400 }
      )
    }

    if (from > to) {
      return NextResponse.json(
        { error: "開始日は終了日以前にしてください" },
        { status: 400 }
      )
    }

    const dayCount = countDays(from, to)
    if (dayCount > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: "期間は180日以内にしてください" },
        { status: 400 }
      )
    }

    const records = await prisma.studyRecord.findMany({
      where: {
        user_id: userId,
        study_date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: {
        study_date: true,
        study_hours: true,
        study_minutes: true,
      },
      orderBy: { study_date: "asc" },
    })

    const recordMap = new Map(
      records.map((record) => {
        const dateStr = formatDbDate(record.study_date)
        const totalMinutes = record.study_hours * 60 + record.study_minutes
        return [dateStr, totalMinutes] as const
      })
    )

    const days: {
      study_date: string
      study_hours: number
      study_minutes: number
      total_minutes: number
    }[] = []

    let cursor = from
    while (cursor <= to) {
      const totalMinutes = recordMap.get(cursor) ?? 0
      days.push({
        study_date: cursor,
        study_hours: Math.floor(totalMinutes / 60),
        study_minutes: totalMinutes % 60,
        total_minutes: totalMinutes,
      })
      cursor = shiftDateString(cursor, 1)
    }

    return NextResponse.json({
      from,
      to,
      days,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "グラフ情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}
