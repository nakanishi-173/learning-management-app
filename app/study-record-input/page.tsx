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
import { supabase } from "@/lib/supabase"

type Task = {
  id: number
  text: string
  completed: boolean
}

function getTodayString(): string {
  const today =new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function Home() {

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  const [studyDate, setStudyDate] = useState(getTodayString)
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "", completed: false },
    { id: 2, text: "", completed: false },
    { id: 3, text: "", completed: false },
  ])
  const [studyHour, setStudyHour] = useState("")
  const [studyMinute, setStudyMinute] = useState("")
  const [subject, setSubject] = useState("")
  const [memo, setMemo] = useState("")
  const [isSaving, setIsSaving ] = useState(false)

useEffect(() => {
  const userId = "11111111-1111-1111-1111-111111111111"

  const fetchStudyRecord = async () => {
    const { data, error } = await supabase
    .from("学習記録入力テーブル")
    .select("study_hours, study_minutes, subject, memo")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .maybeSingle()
  
  if (error) {
    console.error(error)
    return
  }

  if (data) {
    setStudyHour(String(data.study_hours))
    setStudyMinute(String(data.study_minutes))
    setSubject(data.subject)
    setMemo(data.memo ?? "")
  } else {
    setStudyHour("")
    setStudyMinute("")
    setSubject("")
    setMemo("")
  }
  }
  
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("本日のタスクテーブル")
      .select("study_task_id, study_task, is_completed")
      .eq("user_id", userId)
      .eq("study_date", studyDate)
      .order("study_task_id")

    if (error) {
      console.error(error)
      return
    }

    if (data && data.length > 0) {
      setTasks(
        data.map((row) => ({
          id: row.study_task_id,
          text: row.study_task,
          completed: row.is_completed,
        }))
      )
    } else {
      setTasks([{ id: 1, text: "", completed: false }])
    }
  }

  fetchStudyRecord()
  fetchTasks()
},[studyDate])

  const handleAddTask = () => {
    setTasks([...tasks, { id: Date.now(), text: "", completed: false }])
  }

  const handleSaveStudyRecord = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const userId = "11111111-1111-1111-1111-111111111111"

    const hasEmptyflection =
      !studyDate ||
      !studyHour ||
      !studyMinute ||
      !subject
    
    if (hasEmptyflection) {
      alert("未入力の項目があります")
      return
    }

    const { error: studyRecordError } = await supabase
      .from("学習記録入力テーブル")
      .upsert({
        user_id: userId,
        study_date: studyDate,
        study_hours: Number(studyHour),
        study_minutes: Number(studyMinute),
        subject: subject,
        memo: memo,
        updated_at: new Date().toISOString(),
      },
    {
      onConflict: "user_id,study_date",
    })

    if (studyRecordError) {
      alert("学習記録の保存に失敗しました: " + studyRecordError.message)
      return
    }

    const taskRows = tasks
    .filter((task) => task.text.trim())
    .map((task, index) => ({
      user_id: userId,
      study_date: studyDate,
      study_task_id: index + 1,
      study_task: task.text,
      is_completed: task.completed,
      updated_at: new Date().toISOString(),
    })) 

    const { error: deleteTaskError } = await supabase
    .from("本日のタスクテーブル")
    .delete()
    .eq("user_id", userId)
    .eq("study_date", studyDate)

    if (deleteTaskError) {
      alert("本日のタスクの削除に失敗しました: " + deleteTaskError.message)
      return
    }

    const { error : taskError } = await supabase
    .from("本日のタスクテーブル")
    .insert(taskRows)

    if(taskError) {
      alert("本日のタスクの保存に失敗しました: " + taskError.message)
      return
    }
    alert("登録しました")
  } finally {
    setIsSaving(false)
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
      <p>学習日選択</p>
      <Input
        type="date"
        value={studyDate}
        onChange={(e) => setStudyDate(e.target.value)}
        className="w-40"
      />
    
    <div className="flex flex-col my-6 gap-2 sm:gap-3">
    <div>
    <p>本日のタスク（目標）</p>
    <div className="flex flex-col gap-2 sm:gap-3">
    {tasks.map((task)=> (
      <div key={task.id} className="flex items-canter gap-2 sm:gap-3">
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

    <div className="flex flex-col my-6 gap-2 sm:gap-3">
      <p>学習内容記入</p>
      <textarea className="min-h-24 w-full rounded-lg border boeder-input bg-transoarent px-2.5 py-2 text-sm"
          placeholder="学習内容"
          value={subject}
          onChange={(e) => 
            setSubject(e.target.value)
          }
        />
    </div>

    <div>
      <p>メモ</p>
      <textarea 
        className="min-h-24 w-full rounded-lg border boeder-input bg-transoarent px-2.5 py-2 text-sm"
        value={memo}
        onChange={(e) => 
          setMemo(e.target.value)
        }
        />
    </div>
    </div>
    </CardContent>
    </Card>

    <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
    <Button className="w-full sm:w-auto" onClick={handleSaveStudyRecord}>
          登録
        </Button>
      </CardFooter> 
  </div>
  </div>
)
}