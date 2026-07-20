import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const userId = "11111111-1111-1111-1111-111111111111"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studyDate = searchParams.get("study_date")

    if (!studyDate) {
      return NextResponse.json(
        { error: "学習日が指定されていません" },
        { status: 400 }
      )
    }

    const studyRecord = await prisma.studyRecord.findUnique({
      where: {
        user_id_study_date: {
          user_id: userId,
          study_date: new Date(studyDate),
        },
      },
      include: {
        studyTasks: {
          orderBy: { study_task_id: "asc" },
        },
      },
    })

    if (!studyRecord) {
      return NextResponse.json({
        study_hours: null,
        study_minutes: null,
        subject: null,
        memo: null,
        tasks: [],
      })
    }

    return NextResponse.json({
      study_hours: studyRecord.study_hours,
      study_minutes: studyRecord.study_minutes,
      subject: studyRecord.subject,
      memo: studyRecord.memo,
      tasks: studyRecord.studyTasks.map((task) => ({
        study_task_id: task.study_task_id,
        study_task: task.study_task,
        is_completed: task.is_completed,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "学習記録の取得に失敗しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      study_date,
      study_hours,
      study_minutes,
      subject,
      memo,
      tasks,
    } = body

    const validTasks = (tasks ?? []).filter(
      (task: { study_task?: string }) => task.study_task?.trim()
    )

    if (
      !study_date ||
      study_hours === undefined ||
      study_hours === "" ||
      study_minutes === undefined ||
      study_minutes === "" ||
      !subject ||
      validTasks.length === 0
    ) {
      return NextResponse.json(
        { error: "未入力の項目があります" },
        { status: 400 }
      )
    }

    const taskRows = validTasks.map(
      (task: { study_task: string; is_completed?: boolean }, index: number) => ({
        user_id: userId,
        study_date: new Date(study_date),
        study_task_id: index + 1,
        study_task: task.study_task,
        is_completed: task.is_completed ?? false,
      })
    )

    await prisma.$transaction(async (tx) => {
      await tx.studyRecord.upsert({
        where: {
          user_id_study_date: {
            user_id: userId,
            study_date: new Date(study_date),
          },
        },
        update: {
          study_hours: Number(study_hours),
          study_minutes: Number(study_minutes),
          subject,
          memo: memo ?? null,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          study_date: new Date(study_date),
          study_hours: Number(study_hours),
          study_minutes: Number(study_minutes),
          subject,
          memo: memo ?? null,
        },
      })

      await tx.studyTask.deleteMany({
        where: {
          user_id: userId,
          study_date: new Date(study_date),
        },
      })

      if (taskRows.length > 0) {
        await tx.studyTask.createMany({
          data: taskRows,
        })
      }
    })

    return NextResponse.json({ message: "登録しました" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "学習記録の保存に失敗しました" },
      { status: 500 }
    )
  }
}