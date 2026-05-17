import { ArrowLeft, Bookmark, CheckCircle2, Heart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/useAuthStore"
import { useWordStore } from "@/stores/useWordStore"
import AuthControls from "@/components/AuthControls"

type DefinitionItem = {
  id: number
  pos: string
  meaningZh: string
  by: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
}

type MemoryItem = {
  id: number
  content: string
  by: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
}

type ApplicationItem = {
  id: number
  zh: string
  en: string
  by: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
}

type WordDetailPayload = {
  success: boolean
  word: string
  definitions: DefinitionItem[]
  memories: MemoryItem[]
  applications: ApplicationItem[]
  error?: string
}

const POS_OPTIONS = ["n.", "v.", "adj.", "adv.", "pron.", "num.", "art.", "prep.", "conj.", "int."] as const

function formatTime(input: string): string {
  try {
    return new Date(input).toLocaleString()
  } catch {
    return input
  }
}

async function readJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function WordDetail() {
  const { word } = useParams()
  const decoded = useMemo(() => {
    if (!word) return ""
    try {
      return decodeURIComponent(word)
    } catch {
      return word
    }
  }, [word])

  const { words } = useWordStore()
  const hit = useMemo(() => words.find((w) => w.word.toLowerCase() === decoded.toLowerCase()), [decoded, words])
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [definitions, setDefinitions] = useState<DefinitionItem[]>([])
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [likeError, setLikeError] = useState<string | null>(null)

  const [defPos, setDefPos] = useState<(typeof POS_OPTIONS)[number]>("n.")
  const [defMeaning, setDefMeaning] = useState("")
  const [defSubmitting, setDefSubmitting] = useState(false)
  const [defError, setDefError] = useState<string | null>(null)

  const [memContent, setMemContent] = useState("")
  const [memSubmitting, setMemSubmitting] = useState(false)
  const [memError, setMemError] = useState<string | null>(null)

  const [appZh, setAppZh] = useState("")
  const [appEn, setAppEn] = useState("")
  const [appSubmitting, setAppSubmitting] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)

  useEffect(() => {
    const w = decoded.trim()
    if (!w) return
    let aborted = false
    setLoading(true)
    setLoadError(null)
    ;(async () => {
      try {
        const headers: Record<string, string> = {}
        if (token) headers.authorization = `Bearer ${token}`
        const res = await fetch(`/api/word/${encodeURIComponent(w)}`, { method: "GET", headers })
        const json = (await readJsonSafe(res)) as WordDetailPayload | null
        if (!res.ok || !json?.success) {
          if (aborted) return
          setLoadError(json?.error || "load_failed")
          setLoading(false)
          return
        }
        if (aborted) return
        setDefinitions(json.definitions || [])
        setMemories(json.memories || [])
        setApplications(json.applications || [])
        setLoading(false)
      } catch {
        if (aborted) return
        setLoadError("network_error")
        setLoading(false)
      }
    })()
    return () => {
      aborted = true
    }
  }, [decoded, token])

  async function authedPost(url: string, body: any): Promise<{ ok: true; json: any } | { ok: false; error: string }> {
    if (!token) return { ok: false, error: "unauthorized" }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const json = await readJsonSafe(res)
      if (!res.ok || !json?.success) return { ok: false, error: json?.error || "request_failed" }
      return { ok: true, json }
    } catch {
      return { ok: false, error: "network_error" }
    }
  }

  async function toggleDefinitionLike(id: number) {
    setLikeError(null)
    const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/definitions/${id}/like`, {})
    if (!r.ok) {
      setLikeError("error" in r ? r.error : "request_failed")
      return
    }
    const liked = Boolean(r.json?.liked)
    const likeCount = Number(r.json?.likeCount ?? 0)
    setDefinitions((prev) => prev.map((d) => (d.id === id ? { ...d, likedByMe: liked, likeCount } : d)))
  }

  async function toggleMemoryLike(id: number) {
    setLikeError(null)
    const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/memories/${id}/like`, {})
    if (!r.ok) {
      setLikeError("error" in r ? r.error : "request_failed")
      return
    }
    const liked = Boolean(r.json?.liked)
    const likeCount = Number(r.json?.likeCount ?? 0)
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, likedByMe: liked, likeCount } : m)))
  }

  async function toggleApplicationLike(id: number) {
    setLikeError(null)
    const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/applications/${id}/like`, {})
    if (!r.ok) {
      setLikeError("error" in r ? r.error : "request_failed")
      return
    }
    const liked = Boolean(r.json?.liked)
    const likeCount = Number(r.json?.likeCount ?? 0)
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, likedByMe: liked, likeCount } : a)))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-4 py-2 text-sm shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))] transition hover:bg-[rgba(var(--paper2),0.9)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回词卡墙
        </Link>
        <AuthControls />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] shadow-[0_22px_60px_rgba(var(--shadow),var(--shadow-a))]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="font-[var(--font-display)] text-[34px] font-[700] leading-none tracking-[0.01em] sm:text-[44px]">
                {hit?.word ?? decoded}
              </div>
              <div className="mt-2 text-sm text-[rgb(var(--ink2))]">详情页由三个模块组成：释义 / 记忆方法 / 应用。</div>
              {loading ? (
                <div className="mt-2 text-xs text-[rgb(var(--ink2))]">加载中…</div>
              ) : loadError ? (
                <div className="mt-2 text-xs text-[rgb(var(--ink2))]">加载失败：{loadError}</div>
              ) : null}
              {likeError ? <div className="mt-2 text-xs text-[rgb(var(--ink2))]">点赞失败：{likeError}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.35)] px-4 py-2 text-sm transition hover:bg-[rgba(var(--paper),0.55)]"
              >
                <Bookmark className="h-4 w-4" />
                收藏
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.35)] px-4 py-2 text-sm transition hover:bg-[rgba(var(--paper),0.55)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                已学
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(var(--hairline),var(--hairline-a))] p-6 sm:p-8">
          <div className="overflow-x-auto">
            <div className="grid min-w-[960px] grid-cols-3 gap-4">
              <section className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.55)] p-5 shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))]">
                <div className="font-[var(--font-display)] text-[16px] font-[650]">释义</div>
                <div className="mt-3 grid gap-3">
                  {definitions.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--ink2))]">暂无释义。</div>
                  ) : (
                    definitions.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.45)] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="text-sm font-[650]">
                            <span className="mr-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-0.5 text-[11px]">
                              {d.pos}
                            </span>
                            {d.meaningZh}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[rgba(var(--ink2),0.9)]">
                            <div>
                              {d.by} · {formatTime(d.createdAt)}
                            </div>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-1 transition hover:bg-[rgba(var(--paper2),0.75)]"
                              onClick={() => toggleDefinitionLike(d.id)}
                            >
                              <Heart
                                className={cn("h-4 w-4", d.likedByMe ? "text-[rgb(var(--accent))]" : "text-[rgba(var(--ink2),0.9)]")}
                                fill={d.likedByMe ? "currentColor" : "none"}
                              />
                              <span>{d.likeCount ?? 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="mt-2 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.4)] p-4">
                    <div className="grid gap-2">
                      <div className="text-xs text-[rgb(var(--ink2))]">添加释义（词性 + 中文释义）</div>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={defPos}
                          onChange={(e) => setDefPos(e.target.value as (typeof POS_OPTIONS)[number])}
                          className="col-span-1 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.6)] px-3 py-2 text-sm outline-none"
                        >
                          {POS_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          value={defMeaning}
                          onChange={(e) => setDefMeaning(e.target.value)}
                          placeholder="中文释义"
                          className="col-span-2 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.6)] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      {defError ? <div className="text-xs text-[rgb(var(--ink2))]">提交失败：{defError}</div> : null}
                      <button
                        type="button"
                        disabled={defSubmitting}
                        className={cn(
                          "inline-flex items-center justify-center rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--accent),0.85)] px-4 py-2 text-sm font-[650] text-[rgb(var(--paper))] transition hover:bg-[rgba(var(--accent),0.95)]",
                          defSubmitting ? "opacity-70" : "",
                        )}
                        onClick={async () => {
                          setDefError(null)
                          if (!user?.username || !token) {
                            setDefError("请先登录")
                            return
                          }
                          const pos = defPos.trim()
                          const meaningZh = defMeaning.trim()
                          if (!pos || !meaningZh) {
                            setDefError("请填写词性和中文释义")
                            return
                          }
                          setDefSubmitting(true)
                          const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/definitions`, { pos, meaningZh })
                          setDefSubmitting(false)
                          if (!r.ok) {
                            setDefError("error" in r ? r.error : "request_failed")
                            return
                          }
                          const created = r.json?.definition as DefinitionItem | undefined
                          if (created) {
                            setDefinitions((prev) => [created, ...prev])
                            setDefPos("n.")
                            setDefMeaning("")
                          }
                        }}
                      >
                        {defSubmitting ? "发送中…" : "发送"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.55)] p-5 shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))]">
                <div className="font-[var(--font-display)] text-[16px] font-[650]">记忆方法</div>
                <div className="mt-3 grid gap-3">
                  {memories.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--ink2))]">暂无内容。</div>
                  ) : (
                    memories.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.45)] px-4 py-3"
                      >
                        <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[rgba(var(--ink2),0.9)]">
                          <div>
                            {m.by} · {formatTime(m.createdAt)}
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-1 transition hover:bg-[rgba(var(--paper2),0.75)]"
                            onClick={() => toggleMemoryLike(m.id)}
                          >
                            <Heart
                              className={cn("h-4 w-4", m.likedByMe ? "text-[rgb(var(--accent))]" : "text-[rgba(var(--ink2),0.9)]")}
                              fill={m.likedByMe ? "currentColor" : "none"}
                            />
                            <span>{m.likeCount ?? 0}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="mt-2 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.4)] p-4">
                    <div className="grid gap-2">
                      <div className="text-xs text-[rgb(var(--ink2))]">添加记忆方法（自由文本）</div>
                      <textarea
                        value={memContent}
                        onChange={(e) => setMemContent(e.target.value)}
                        placeholder="写下你的记忆方法…"
                        rows={4}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.6)] px-3 py-2 text-sm outline-none"
                      />
                      {memError ? <div className="text-xs text-[rgb(var(--ink2))]">提交失败：{memError}</div> : null}
                      <button
                        type="button"
                        disabled={memSubmitting}
                        className={cn(
                          "inline-flex items-center justify-center rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--accent),0.85)] px-4 py-2 text-sm font-[650] text-[rgb(var(--paper))] transition hover:bg-[rgba(var(--accent),0.95)]",
                          memSubmitting ? "opacity-70" : "",
                        )}
                        onClick={async () => {
                          setMemError(null)
                          if (!user?.username || !token) {
                            setMemError("请先登录")
                            return
                          }
                          const content = memContent.trim()
                          if (!content) {
                            setMemError("请输入内容")
                            return
                          }
                          setMemSubmitting(true)
                          const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/memories`, { content })
                          setMemSubmitting(false)
                          if (!r.ok) {
                            setMemError("error" in r ? r.error : "request_failed")
                            return
                          }
                          const created = r.json?.memory as MemoryItem | undefined
                          if (created) {
                            setMemories((prev) => [created, ...prev])
                            setMemContent("")
                          }
                        }}
                      >
                        {memSubmitting ? "发送中…" : "发送"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.55)] p-5 shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))]">
                <div className="font-[var(--font-display)] text-[16px] font-[650]">应用</div>
                <div className="mt-3 grid gap-3">
                  {applications.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--ink2))]">暂无内容。</div>
                  ) : (
                    applications.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.45)] px-4 py-3"
                      >
                        <div className="grid gap-2">
                          <div className="text-sm">
                            <span className="mr-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-0.5 text-[11px]">
                              中文
                            </span>
                            {a.zh}
                          </div>
                          <div className="text-sm">
                            <span className="mr-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-0.5 text-[11px]">
                              英文
                            </span>
                            {a.en}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[rgba(var(--ink2),0.9)]">
                          <div>
                            {a.by} · {formatTime(a.createdAt)}
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-2 py-1 transition hover:bg-[rgba(var(--paper2),0.75)]"
                            onClick={() => toggleApplicationLike(a.id)}
                          >
                            <Heart
                              className={cn("h-4 w-4", a.likedByMe ? "text-[rgb(var(--accent))]" : "text-[rgba(var(--ink2),0.9)]")}
                              fill={a.likedByMe ? "currentColor" : "none"}
                            />
                            <span>{a.likeCount ?? 0}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="mt-2 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.4)] p-4">
                    <div className="grid gap-2">
                      <div className="text-xs text-[rgb(var(--ink2))]">添加应用（中文 + 英文）</div>
                      <textarea
                        value={appZh}
                        onChange={(e) => setAppZh(e.target.value)}
                        placeholder="中文"
                        rows={3}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.6)] px-3 py-2 text-sm outline-none"
                      />
                      <textarea
                        value={appEn}
                        onChange={(e) => setAppEn(e.target.value)}
                        placeholder="英文"
                        rows={3}
                        className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.6)] px-3 py-2 text-sm outline-none"
                      />
                      {appError ? <div className="text-xs text-[rgb(var(--ink2))]">提交失败：{appError}</div> : null}
                      <button
                        type="button"
                        disabled={appSubmitting}
                        className={cn(
                          "inline-flex items-center justify-center rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--accent),0.85)] px-4 py-2 text-sm font-[650] text-[rgb(var(--paper))] transition hover:bg-[rgba(var(--accent),0.95)]",
                          appSubmitting ? "opacity-70" : "",
                        )}
                        onClick={async () => {
                          setAppError(null)
                          if (!user?.username || !token) {
                            setAppError("请先登录")
                            return
                          }
                          const zh = appZh.trim()
                          const en = appEn.trim()
                          if (!zh || !en) {
                            setAppError("请填写中文和英文")
                            return
                          }
                          setAppSubmitting(true)
                          const r = await authedPost(`/api/word/${encodeURIComponent(decoded)}/applications`, { zh, en })
                          setAppSubmitting(false)
                          if (!r.ok) {
                            setAppError("error" in r ? r.error : "request_failed")
                            return
                          }
                          const created = r.json?.application as ApplicationItem | undefined
                          if (created) {
                            setApplications((prev) => [created, ...prev])
                            setAppZh("")
                            setAppEn("")
                          }
                        }}
                      >
                        {appSubmitting ? "发送中…" : "发送"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
