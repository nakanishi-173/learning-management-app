"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { StudyCalendar } from "@/app/components/progress/StudyCalendar"
import { StudyRecordDetail } from "@/app/components/progress/StudyRecordDetail"
import { StudyTimeChart } from "@/app/components/progress/StudyTimeChart"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toDateString } from "@/lib/date"

export default function ProgressPage() {
  const router = useRouter()

  // カレンダーで選択中の学習日（初期値は今日）
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))

  return (
    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
      <h2 className="text-base font-medium">学習進捗グラフ・カレンダー</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        日別の学習時間をグラフで確認し、カレンダーから学習記録の詳細を表示できます。
      </p>

      <div className="flex flex-col gap-6">
        {/* 日別学習時間の折れ線グラフ */}
        <StudyTimeChart />

        {/* 学習カレンダーと選択日の詳細（1つの Card にまとめる） */}
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">学習カレンダー</p>
              <p className="mt-1 text-sm text-muted-foreground">
                日付を選ぶと、同じカード内にその日の学習記録が表示されます。
              </p>
            </div>

            <StudyCalendar
              embedded
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <div className="border-t border-border pt-4">
              <StudyRecordDetail embedded studyDate={selectedDate} />
            </div>
          </CardContent>
        </Card>

        {/* ダッシュボードへ戻る */}
        <CardFooter className="mt-0 border-t-0 bg-transparent flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push("/")}
          >
            ダッシュボードに戻る
          </Button>
        </CardFooter>
      </div>
    </div>
  )
}
