"use client"

import { useState } from 'react'

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
 } from '@/components/ui/select'

import { Button } from '@/components/ui/button'

// 年の選択範囲（2026〜2030）
const start_year = 2026
const end_year = 2030
// Select用の年・月の選択肢
const years = Array.from(
    { length: end_year - start_year +1 },
    (_, i) => start_year + i
)
const months = Array.from({ length: 12 }, (_, i) => i +1 )

// 振り返り入力フォームの型
type ReflectionInput = {
    studyContent: string
    challenge: string
    improvement: string
    memo: string
}

export default function Home() {
// 画面上の入力値を保持する
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [form, setForm] = useState<ReflectionInput>({
    studyContent: "",
    challenge: "",
    improvement: "",
    memo: "",
  })

// 登録ボタン押下時: 入力チェック後に振り返りAPIへPOSTする
  const handleSaveReflection = async () => {
    
    const hasEmptyflection =
      !year ||
      !month ||
      !form.studyContent ||
      !form.challenge ||
      !form.improvement
    
    if (hasEmptyflection) {
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
        {/* 入力年月選択 */}
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
        
        {/* 振り返りの入力項目 */}
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
            setForm({ ... form,improvement: e.target.value})
          }
        />
        </div>

        <div>
        <p>メモ</p>
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-transoarent px-2.5 py-2 text-sm"
          value={form.memo}
          onChange={(e) => 
            setForm({ ... form,memo: e.target.value})
          }
        />
        </div>
        </div>
      </CardContent>
      </Card>

      {/* 登録ボタン */}
      <CardFooter className="mt-6 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={handleSaveReflection}>
          登録
        </Button>
      </CardFooter>
     </div>
     </div>

    )
}