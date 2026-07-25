export async function fetchPostLoginPath(): Promise<string> {
  const res = await fetch("/api/initial-settings")
  if (!res.ok) return "/"
  const data = (await res.json()) as { setting: unknown | null }
  return data.setting ? "/" : "/initial-settings"
}
