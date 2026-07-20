"use client"

import { Card, CardContent } from "@/components/ui/card"

export type DashboardTask = {
  study_task_id: number
  study_task: string
  is_completed: boolean
}

type TodayTasksProps = {
  tasks: DashboardTask[]
  onToggle: (taskId: number, isCompleted: boolean) => void
  isUpdating?: boolean
}

export function TodayTasks({
  tasks,
  onToggle,
  isUpdating = false,
}: TodayTasksProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">本日のタスク</p>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            本日のタスクはまだありません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li
                key={task.study_task_id}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  disabled={isUpdating}
                  onChange={(e) =>
                    onToggle(task.study_task_id, e.target.checked)
                  }
                  className="size-4 shrink-0 rounded border border-input"
                />
                <span
                  className={
                    task.is_completed
                      ? "text-sm text-muted-foreground line-through"
                      : "text-sm"
                  }
                >
                  {task.study_task}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
