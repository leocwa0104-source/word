import { useDeferredValue, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "@/components/TopBar"
import WordWall from "@/components/WordWall"
import { useWordStore } from "@/stores/useWordStore"
import type { WordEntry } from "@/types/word"

function parseCsv(text: string): WordEntry[] {
  const lines = text
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean)

  const entries: WordEntry[] = []
  for (const line of lines) {
    const word = line.split(/[,\t;]/g)[0]?.trim()
    if (!word) continue
    entries.push({ id: word.toLowerCase(), word })
  }
  return entries
}

function parseJson(text: string): WordEntry[] {
  const parsed = JSON.parse(text) as unknown
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((x) => {
      if (typeof x === "string") return { id: x.toLowerCase(), word: x }
      if (x && typeof x === "object" && "word" in x && typeof (x as any).word === "string") {
        const w = (x as any).word as string
        return { id: w.toLowerCase(), word: w }
      }
      return null
    })
    .filter(Boolean) as WordEntry[]
}

export default function Home() {
  const navigate = useNavigate()
  const { words, setImportedWords, resetToSample, source } = useWordStore()
  const [query, setQuery] = useState("")
  const dq = useDeferredValue(query)
  const [banner, setBanner] = useState<{ kind: "error" | "ok"; text: string } | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)

  const filtered = useMemo(() => {
    const q = dq.trim().toLowerCase()
    if (!q) return words
    return words.filter((w) => w.word.toLowerCase().includes(q))
  }, [dq, words])

  return (
    <div>
      <TopBar
        query={query}
        onQueryChange={(v) => {
          setQuery(v)
          if (banner) setBanner(null)
        }}
        totalCount={filtered.length}
        visibleCount={visibleCount}
        source={source}
        onPickFile={async (file) => {
          try {
            const text = await file.text()
            const entries =
              file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv" ? parseCsv(text) : parseJson(text)

            if (entries.length === 0) {
              setBanner({ kind: "error", text: "导入失败：没有解析到任何单词。建议使用 JSON 数组或每行一个单词的 CSV。" })
              return
            }

            setImportedWords(entries)
            setQuery("")
            setBanner({ kind: "ok", text: `导入成功：${entries.length.toLocaleString()} 个单词已加载到主页。` })
          } catch {
            setBanner({ kind: "error", text: "导入失败：文件无法解析。请确认是合法的 JSON 或 CSV。" })
          }
        }}
        onReset={() => {
          resetToSample()
          setQuery("")
          setBanner({ kind: "ok", text: "已重置为示例词表。" })
        }}
      />

      {banner ? (
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <div
            className={[
              "rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_rgba(var(--shadow),var(--shadow-a))]",
              banner.kind === "error"
                ? "border-[rgba(var(--accent2),0.35)] bg-[rgba(var(--accent2),0.08)]"
                : "border-[rgba(var(--accent),0.35)] bg-[rgba(var(--accent),0.08)]",
            ].join(" ")}
          >
            {banner.text}
          </div>
        </div>
      ) : null}

      <WordWall
        entries={filtered}
        onOpen={(entry) => navigate(`/w/${encodeURIComponent(entry.word)}`)}
        onVisibleCountChange={setVisibleCount}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(var(--paper),0.92)] to-transparent" />
    </div>
  )
}
