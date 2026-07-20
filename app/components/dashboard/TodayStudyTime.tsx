import { Card, CardContent } from "@/components/ui/card"

type TodayStudyTimeProps = {
  hours: number
  minutes: number
}

export function TodayStudyTime({ hours, minutes }: TodayStudyTimeProps) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">本日の学習時間</p>
        <p className="mt-1 text-2xl font-medium">
          {hours}
          <span className="ml-1 text-base font-normal">時間</span>
          <span className="ml-2">{minutes}</span>
          <span className="ml-1 text-base font-normal">分</span>
        </p>
      </CardContent>
    </Card>
  )
}
