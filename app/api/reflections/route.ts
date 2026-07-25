import { requireUserId } from "@/lib/auth"
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

    if (studyYear && studyMonth) {
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

      const reflection = await prisma.reflection.findUnique({
        where: {
          user_id_study_year_study_month: {
            user_id: userId,
            study_year: year,
            study_month: month,
          },
        },
      })

      if (!reflection) {
        return NextResponse.json({
          study_content: null,
          challenge: null,
          improvement: null,
          memo: null,
        })
      }

      return NextResponse.json({
        study_content: reflection.study_content,
        challenge: reflection.challenge,
        improvement: reflection.improvement,
        memo: reflection.memo,
      })
    }

    const reflections = await prisma.reflection.findMany({
      where: { user_id: userId },
      orderBy: [{ study_year: "desc" }, { study_month: "desc" }],
    })

    return NextResponse.json(reflections)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "振り返りの取得に失敗しました" },
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
      study_year,
      study_month,
      study_content,
      challenge,
      improvement,
      memo,
    } = body

    if (
      !study_year ||
      !study_month ||
      !study_content ||
      !challenge ||
      !improvement
    ) {
      return NextResponse.json(
        { error: "未入力の項目があります" },
        { status: 400 }
      )
    }

    await prisma.reflection.upsert({
      where: {
        user_id_study_year_study_month: {
          user_id: userId,
          study_year: Number(study_year),
          study_month: Number(study_month),
        },
      },
      update: {
        study_content,
        challenge,
        improvement,
        memo: memo ?? null,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        study_year: Number(study_year),
        study_month: Number(study_month),
        study_content,
        challenge,
        improvement,
        memo: memo ?? null,
      },
    })

    return NextResponse.json({ message: "登録しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "振り返りの保存に失敗しました" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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

    const existing = await prisma.reflection.findUnique({
      where: {
        user_id_study_year_study_month: {
          user_id: userId,
          study_year: year,
          study_month: month,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "振り返りが見つかりません" },
        { status: 404 }
      )
    }

    await prisma.reflection.delete({
      where: {
        user_id_study_year_study_month: {
          user_id: userId,
          study_year: year,
          study_month: month,
        },
      },
    })

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "振り返りの削除に失敗しました" },
      { status: 500 }
    )
  }
}
