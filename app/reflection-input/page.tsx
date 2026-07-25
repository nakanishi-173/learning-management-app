"use client"

import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"

const start_year = 2026
const end_year = 2030
const years = Array.from(
  { length: end_year - start_year + 1 },
  (_, i) => start_year + i
)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

type ReflectionInput = {
  studyContent: string
  challenge: string
  improvement: string
  memo: string
}

const emptyForm = (): ReflectionInput => ({
  studyContent: "",
  challenge: "",
  improvement: "",
  memo: "",
})

export default function Home() {
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [form, setForm] = useState<ReflectionInput>(emptyForm())
  const [hasExistingReflection, setHasExistingReflection] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!year || !month) {
      setForm(emptyForm())
      setHasExistingReflection(false)
      return
    }

    const controller = new AbortController()
    const fetchReflection = async () => {
      try {
        const res = await fetch(
          `/api/reflections?study_year=${year}&study_month=${month}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          console.error("振り返りの取得に失敗しました")
          return
        }
        const data = await res.json()
        if (data.study_content !== null) {
          setForm({
            studyContent: data.study_content,
            challenge: data.challenge,
            improvement: data.improvement,
            memo: data.memo ?? "",
          })
          setHasExistingReflection(true)
        } else {
          setForm(emptyForm())
          setHasExistingReflection(false)
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error(error)
      }
    }
    fetchReflection()
    return () => {
      controller.abort()
    }
  }, [year, month])

  const handleSaveReflection = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const hasEmptyField =
        !year ||
        !month ||
        !form.studyContent ||
        !form.challenge ||
        !form.improvement

      if (hasEmptyField) {
        alert("未入力の項目があります")
        return
      }
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_year: Number(year),
          study_month: Number(month),
          study_content: form.studyContent,
          challenge: form.challenge,
          improvement: form.improvement,
          memo: form.memo,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error ?? "振り返りの保存に失敗しました")
        return
      }
      alert("登録しました")
      setHasExistingReflection(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteReflection = async () => {
    if (isDeleting || !hasExistingReflection || !year || !month) return
    if (!confirm(`${year}年${month}月の振り返りを削除しますか？`)) return

    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/reflections?study_year=${year}&study_month=${month}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const { error } = await res.json()
        alert(error ?? "振り返りの削除に失敗しました")
        return
      }
      alert("削除しました")
      setForm(emptyForm())
      setHasExistingReflection(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">振り返り入力</h2>
      <p className="text-sm text-muted-foreground mb-6">
        プログラミング言語学習における月次の振り返りを入力してください。
      </p>

      <div className="flex flex-col gap-6">
        <Card size="sm">
          <CardContent>
            <p>入力年月選択</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue placeholder="年" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>年</span>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-20 sm:w-24">
                  <SelectValue placeholder="月" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>月</span>
            </div>

            <div className="flex flex-col my-6 gap-2 sm:gap-3">
              <div>
                <p>主に学習した内容</p>
                <textarea
                  className="min-h-24 w-full rounded-lg border boeder-input bg-transoarent px-2.5 py-2 text-sm"
                  placeholder="学習内容"
                  value={form.studyContent}
                  onChange={(e) =>
                    setForm({ ...form, studyContent: e.target.value })
                  }
                />
              </div>

              <div>
                <p>課題</p>
                <textarea
                  className="min-h-24 w-full rounded-lg border boeder-input bg-transoarent px-2.5 py-2 text-sm"
                  placeholder="学習した中で分からなかったところや学習ペースでの課題感など"
                  value={form.challenge}
                  onChange={(e) =>
                    setForm({ ...form, challenge: e.target.value })
                  }
                />
              </div>

              <div>
                <p>改善案</p>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-input bg-transoarent px-2.5 py-2 text-sm"
                  placeholder="来月どう学習していくか、学習計画など"
                  value={form.improvement}
                  onChange={(e) =>
                    setForm({ ...form, improvement: e.target.value })
                  }
                />
              </div>

              <div>
                <p>メモ</p>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-input bg-transoarent px-2.5 py-2 text-sm"
                  value={form.memo}
                  onChange={(e) =>
                    setForm({ ...form, memo: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {hasExistingReflection && (
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting || isSaving}
              onClick={handleDeleteReflection}
            >
              削除
            </Button>
          )}
          <Button
            className="w-full sm:w-auto"
            disabled={isSaving || isDeleting}
            onClick={handleSaveReflection}
          >
            登録
          </Button>
        </CardFooter>
      </div>
    </div>
  )
}
