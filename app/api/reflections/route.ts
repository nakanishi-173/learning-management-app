import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const userId = "11111111-1111-1111-1111-111111111111"

export async function GET() {
 try {
   const reflections = await prisma.reflection.findMany({
    orderBy: [
      { study_year: "desc" },
      { study_month: "desc" },
    ],
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
  try{
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