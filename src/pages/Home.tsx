import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "@/components/TopBar"
import WordWall from "@/components/WordWall"
import { useWordStore } from "@/stores/useWordStore"
import type { WordEntry } from "@/types/word"

function isHeadwordCandidate(word: string): boolean {
  if (word.length === 0 || word.length > 64) return false
  if (!/^[A-Za-z]/.test(word)) return false
  if (word.includes("..")) return false
  if (word.includes("{") || word.includes("}") || word.includes("<") || word.includes(">")) return false
  if (word.includes("/") || word.includes("\\") || word.includes("_")) return false
  if (word.includes(".") || word.includes("@")) return false
  if (!/^[A-Za-z](?:[A-Za-z' -]*[A-Za-z])?$/.test(word)) return false
  if (word.includes("  ")) return false
  return true
}

function parsePlainWordlist(text: string): WordEntry[] {
  const lines = text
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean)

  const entries: WordEntry[] = []
  for (const line of lines) {
    const word = line.split(/[,\t;]/g)[0]?.trim()
    if (!word) continue
    if (!isHeadwordCandidate(word)) continue
    entries.push({ id: word.toLowerCase(), word })
  }
  return entries
}

export default function Home() {
  const navigate = useNavigate()
  const { words, setWords } = useWordStore()
  const [query, setQuery] = useState("")
  const dq = useDeferredValue(query)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/wordlist.txt", { cache: "no-store" })
        if (!res.ok) return
        const text = await res.text()
        const head = text.trimStart().slice(0, 200)
        if (
          head.startsWith("<") ||
          head.startsWith("(") ||
          head.startsWith("{") ||
          head.startsWith("[") ||
          head.startsWith("/*") ||
          head.startsWith("//") ||
          head.includes("{") ||
          head.includes("}") ||
          /\b(import|export|function|const|let|var)\b/.test(head) ||
          head.includes("=>") ||
          /<html|<head|<body/i.test(head)
        ) {
          return
        }
        const entries = parsePlainWordlist(text)
        if (entries.length < 5000) return
        const firstLetters = new Set(entries.map((e) => e.word[0]?.toLowerCase()).filter(Boolean))
        if (firstLetters.size < 18) return
        if (aborted) return
        setWords(entries)
      } catch {
        return
      }
    })()
    return () => {
      aborted = true
    }
  }, [setWords])

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
        }}
        totalCount={filtered.length}
        visibleCount={visibleCount}
      />

      <WordWall
        entries={filtered}
        onOpen={(entry) => navigate(`/w/${encodeURIComponent(entry.word)}`)}
        onVisibleCountChange={setVisibleCount}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(var(--paper),0.92)] to-transparent" />
    </div>
  )
}
