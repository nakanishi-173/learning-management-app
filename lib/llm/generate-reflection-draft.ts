import OpenAI from "openai"

export type StudyRecordForDraft = {
  studyDate: string
  subject: string
  studyHours: number
  studyMinutes: number
  memo: string | null
  tasks: string[]
}

export type ReflectionDraft = {
  study_content: string
  challenge: string
  improvement: string
  memo: string
}

function buildStudyRecordsText(studyRecords: StudyRecordForDraft[]): string {
  return studyRecords
    .map((record) => {
      const tasksText =
        record.tasks.length > 0 ? record.tasks.join("、") : "なし"

      return [
        `- 日付: ${record.studyDate}`,
        `  内容: ${record.subject}`,
        `  時間: ${record.studyHours}時間${record.studyMinutes}分`,
        `  メモ: ${record.memo ?? "なし"}`,
        `  タスク: ${tasksText}`,
      ].join("\n")
    })
    .join("\n")
}

function parseReflectionDraft(content: string): ReflectionDraft {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("下書きの形式が正しくありません")
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("study_content" in parsed) ||
    !("challenge" in parsed) ||
    !("improvement" in parsed)
  ) {
    throw new Error("下書きの形式が正しくありません")
  }

  const draft = parsed as Record<string, unknown>

  if (
    typeof draft.study_content !== "string" ||
    typeof draft.challenge !== "string" ||
    typeof draft.improvement !== "string"
  ) {
    throw new Error("下書きの形式が正しくありません")
  }

  return {
    study_content: draft.study_content,
    challenge: draft.challenge,
    improvement: draft.improvement,
    memo: typeof draft.memo === "string" ? draft.memo : "",
  }
}

export async function generateReflectionDraft(input: {
  year: number
  month: number
  studyRecords: StudyRecordForDraft[]
}): Promise<ReflectionDraft> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY が設定されていません")
  }

  if (input.studyRecords.length === 0) {
    throw new Error("学習記録がありません")
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const systemPrompt = `
あなたはプログラミング学習の振り返りアシスタントです。
与えられた学習記録をもとに、月次振り返りの下書きを日本語で作成してください。
学習記録にない内容は推測しすぎず、自然な文章にしてください。

必ず次の JSON 形式のみで返してください:
{
  "study_content": "主に学習した内容",
  "challenge": "課題",
  "improvement": "改善案",
  "memo": "メモ（任意、空文字でも可）"
}
`.trim()

  const userPrompt = `
${input.year}年${input.month}月の振り返り下書きを作成してください。

【学習記録】
${buildStudyRecordsText(input.studyRecords)}
`.trim()

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("LLM からの応答が空です")
  }

  return parseReflectionDraft(content)
}
