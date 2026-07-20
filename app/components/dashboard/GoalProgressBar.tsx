import { Card, CardContent } from "@/components/ui/card"

type GoalProgressBarProps = {
  percent: number
  targetHours: number
  targetMinutes: number
}

export function GoalProgressBar({
  percent,
  targetHours,
  targetMinutes,
}: GoalProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const hasTarget = targetHours > 0 || targetMinutes > 0

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">目標進捗</p>
            <p className="mt-1 text-2xl font-medium">
              {clamped}
              <span className="ml-1 text-base font-normal">%</span>
            </p>
          </div>
          {hasTarget && (
            <p className="text-sm text-muted-foreground">
              目標 {targetHours}時間{targetMinutes}分
            </p>
          )}
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="目標に対する進捗"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${clamped}%` }}
          />
        </div>

        {!hasTarget && (
          <p className="text-sm text-muted-foreground">
            目標学習時間が未設定です
          </p>
        )}
      </CardContent>
    </Card>
  )
}
