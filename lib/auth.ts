import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export type RequireUserIdResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

export async function requireUserId(): Promise<RequireUserIdResult> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      ),
    }
  }

  return { ok: true, userId }
}
