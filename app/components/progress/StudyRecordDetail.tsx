"use client"

import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"

// タスク1件の型
type StudyTask = {
  study_task_id: number
  study_task: string
  is_completed: boolean
}

// 学習記録 API のレスポンス型
type StudyRecordData = {
  study_hours: number | null
  study_minutes: number | null
  subject: string | null
  memo: string | null
  tasks: StudyTask[]
}

// 閲覧専用のテキスト表示欄
function DisplayField({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <p className="mb-1.5 text-sm text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value?.trim() ? value : "未登録"}
      </p>
    </div>
  )
}

function formatStudyDate(studyDate: string): string {
  const [year, month, day] = studyDate.split("-")
  return `${year}年${Number(month)}月${Number(day)}日`
}

function formatStudyTime(hours: number, minutes: number): string {
  return `${hours}時間${minutes}分`
}

type StudyRecordDetailProps = {
  studyDate: string | null
  embedded?: boolean
}

export function StudyRecordDetail({
  studyDate,
  embedded = false,
}: StudyRecordDetailProps) {
  const [data, setData] = useState<StudyRecordData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 選択日が変わったときに学習記録 API から詳細を取得する
  useEffect(() => {
    if (!studyDate) {
      setData(null)
      setError("")
      return
    }

    const controller = new AbortController()

    const fetchStudyRecord = async () => {
      setIsLoading(true)
      setError("")
      try {
        const res = await fetch(
          `/api/study-record?study_date=${studyDate}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? "学習記録の取得に失敗しました")
          setData(null)
          return
        }
        const json = (await res.json()) as StudyRecordData
        setData(json)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        console.error(err)
        setError("学習記録の取得に失敗しました")
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudyRecord()
    return () => controller.abort()
  }, [studyDate])

  if (!studyDate) {
    const emptyMessage = (
      <p className="text-sm text-muted-foreground">
        日付を選択すると、学習記録の詳細が表示されます。
      </p>
    )

    if (embedded) {
      return emptyMessage
    }

    return (
      <Card size="sm">
        <CardContent>{emptyMessage}</CardContent>
      </Card>
    )
  }

  const hasRecord = data?.subject !== null && data?.subject !== undefined

  const detailContent = (
    <>
      <p className="text-sm font-medium">学習記録詳細</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !hasRecord ? (
        <p className="text-sm text-muted-foreground">
          {formatStudyDate(studyDate)}の学習記録はありません。
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 学習日 */}
          <div className="rounded-lg border border-border px-3 py-3">
            <p className="mb-1.5 text-sm text-muted-foreground">学習日</p>
            <p className="text-sm text-foreground">
              {formatStudyDate(studyDate)}
            </p>
          </div>

          {/* 本日のタスク（閲覧のみ） */}
          <div className="rounded-lg border border-border px-3 py-3">
            <p className="mb-2 text-sm text-muted-foreground">
              本日のタスク（目標）
            </p>
            {data.tasks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {data.tasks.map((task) => (
                  <li
                    key={task.study_task_id}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      disabled
                      readOnly
                      className="size-4 shrink-0 rounded border border-input"
                    />
                    <span className="text-sm text-foreground">
                      {task.study_task}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </div>

          {/* 本日の学習時間 */}
          <div className="rounded-lg border border-border px-3 py-3">
            <p className="mb-1.5 text-sm text-muted-foreground">
              本日の学習時間
            </p>
            <p className="text-sm text-foreground">
              {formatStudyTime(data.study_hours ?? 0, data.study_minutes ?? 0)}
            </p>
          </div>

          {/* 学習内容・メモ */}
          <DisplayField label="学習内容" value={data.subject} />
          <DisplayField label="メモ" value={data.memo} />
        </div>
      )}
    </>
  )

  if (embedded) {
    return <div className="flex flex-col gap-3">{detailContent}</div>
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">{detailContent}</CardContent>
    </Card>
  )
}
