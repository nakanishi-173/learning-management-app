import { Card, CardContent } from "@/components/ui/card"

type StudyStreakProps = {
  days: number
}

export function StudyStreak({ days }: StudyStreakProps) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">連続学習日数</p>
        <p className="mt-1 text-2xl font-medium">
          {days}
          <span className="ml-1 text-base font-normal">日</span>
        </p>
      </CardContent>
    </Card>
  )
}
