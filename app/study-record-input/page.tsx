"use client"

import { useState, useEffect } from "react"

import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { 
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
 } from '@/components/ui/select'

import { Button } from '@/components/ui/button'

// タスク1件の型
type Task = {
  id: number
  text: string
  completed: boolean
}

// 今日の日付を YYYY-MM-DD 形式で返す
function getTodayString(): string {
  const today =new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function StudyRecordInputPage() {

// Select用の時・分の選択肢
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

// 画面上の入力値を保持する
  const [studyDate, setStudyDate] = useState(getTodayString)
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "", completed: false },
  ])
  const [studyHour, setStudyHour] = useState("")
  const [studyMinute, setStudyMinute] = useState("")
  const [subject, setSubject] = useState("")
  const [memo, setMemo] = useState("")
  const [hasExistingRecord, setHasExistingRecord] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const resetForm = () => {
    setStudyHour("")
    setStudyMinute("")
    setSubject("")
    setMemo("")
    setTasks([{ id: 1, text: "", completed: false }])
    setHasExistingRecord(false)
  }

// 学習日が変わったときに学習記録 API からデータを取得してフォームに反映する
  useEffect(() => {
    const controller = new AbortController()
    const fetchStudyRecord = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/study-record?study_date=${studyDate}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          console.error("学習記録の取得に失敗しました")
          return
        }
        const data = await res.json()
        if (data.subject !== null) {
          setStudyHour(String(data.study_hours))
          setStudyMinute(String(data.study_minutes))
          setSubject(data.subject)
          setMemo(data.memo ?? "")
          setHasExistingRecord(true)
        } else {
          resetForm()
        }
        if (data.tasks && data.tasks.length > 0) {
          setTasks(
            data.tasks.map((row: {
              study_task_id: number
              study_task: string
              is_completed: boolean
            }) => ({
              id: row.study_task_id,
              text: row.study_task,
              completed: row.is_completed,
            }))
          )
        } else {
          setTasks([{ id: 1, text: "", completed: false }])
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudyRecord()
    return () => {
      controller.abort()
    }
  }, [studyDate])

// タスク入力欄を1件追加
  const handleAddTask = () => {
    setTasks([...tasks, { id: Date.now(), text: "", completed: false }])
  }

// 登録ボタン押下時: 入力チェック後に学習記録APIへPOSTする
  const handleSaveStudyRecord = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const hasValidTask = tasks.some((task) => task.text.trim())
      const hasEmptyField =
        !studyDate ||
        !studyHour ||
        !studyMinute ||
        !subject ||
        !hasValidTask
      if (hasEmptyField) {
        alert("未入力の項目があります")
        return
      }
    const res = await fetch("/api/study-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        study_date: studyDate,
        study_hours: Number(studyHour),
        study_minutes: Number(studyMinute),
        subject,
        memo,
        tasks: tasks
          .filter((task) => task.text.trim())
          .map((task) => ({
            study_task: task.text,
            is_completed: task.completed,
          })),
      }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      alert(error ?? "学習記録の保存に失敗しました")
      return
    }
    alert("登録しました")
    setHasExistingRecord(true)
  } finally {
    setIsSaving(false)
  }
}

  const handleDeleteStudyRecord = async () => {
    if (isDeleting || !hasExistingRecord) return
    if (!confirm(`${studyDate} の学習記録を削除しますか？`)) return

    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/study-record?study_date=${studyDate}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const { error } = await res.json()
        alert(error ?? "学習記録の削除に失敗しました")
        return
      }
      alert("削除しました")
      resetForm()
    } finally {
      setIsDeleting(false)
    }
  }

return (
  <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
  <h2 className="text-base font-medium">学習記録入力</h2>
  <p className="text-sm text-muted-foreground mb-6">
    プログラミング言語学習における本日の学習記録を入力してください。
  </p>

  <div className="flex flex-col gap-6">
    <Card size="sm">
    <CardContent>
      {/* 学習日選択 */}
      <p>学習日選択</p>
      <Input
        type="date"
        value={studyDate}
        onChange={(e) => setStudyDate(e.target.value)}
        className="w-40"
      />

    {isLoading ? (
      <p className="my-6 text-sm text-muted-foreground">読み込み中...</p>
    ) : (
    <div className="flex flex-col my-6 gap-2 sm:gap-3">
    {/* 本日のタスク（目標） */}
    <div>
    <p>本日のタスク（目標）</p>
    <div className="flex flex-col gap-2 sm:gap-3">
    {tasks.map((task)=> (
      <div key={task.id} className="flex items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => 
            setTasks((prev) =>
            prev.map((t) =>
            t.id ===task.id ? { ...t, completed: e.target.checked } : t
            ))}
          className="size-4 shrink-0 rounded border border-input"
        />
        </div>
        <Input
          value={task.text}
          onChange={(e) =>
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id ? { ...t, text: e.target.value } : t
              )
            )
          }
          placeholder="タスクを入力"
          className="flex-1"
        />
      </div>
    ))}
    </div>
    </div>
    <div className="flex justify-end">
    <Button
      type="button"
      className="w-full sm:w-auto"
      onClick={handleAddTask}
    >
      +追加
    </Button>
    </div>

    {/* 本日の学習時間 */}
    <div>
      <p>本日の学習時間</p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select value={studyHour} onValueChange={setStudyHour}>
          <SelectTrigger className="w-20 sm:w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {String(hour).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>時</span>
        <Select value={studyMinute} onValueChange={setStudyMinute}>
          <SelectTrigger className="w-20 sm:w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={String(minute)}>
                {String(minute).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>分</span>        
      </div>
    </div>

    {/* 学習内容記入 */}
    <div className="flex flex-col my-6 gap-2 sm:gap-3">
      <p>学習内容記入</p>
      <textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          placeholder="学習内容"
          value={subject}
          onChange={(e) => 
            setSubject(e.target.value)
          }
        />
    </div>

    {/* メモ */}
    <div>
      <p>メモ</p>
      <textarea 
        className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
        value={memo}
        onChange={(e) => 
          setMemo(e.target.value)
        }
        />
    </div>
    </div>
    )}
    </CardContent>
    </Card>

    {/* 登録ボタン */}
    {!isLoading && (
    <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      {hasExistingRecord && (
        <Button
          type="button"
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={isDeleting || isSaving}
          onClick={handleDeleteStudyRecord}
        >
          削除
        </Button>
      )}
      <Button
        className="w-full sm:w-auto"
        disabled={isSaving || isDeleting}
        onClick={handleSaveStudyRecord}
      >
        登録
      </Button>
    </CardFooter>
    )}
  </div>
  </div>
)
}