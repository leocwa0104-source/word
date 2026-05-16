import { create } from "zustand"
import { sampleWords } from "@/data/sampleWords"
import type { WordEntry } from "@/types/word"

const STORAGE_KEY = "wordwall.words.v1"

type WordSource = "sample" | "imported"

type WordState = {
  words: WordEntry[]
  source: WordSource
  setImportedWords: (entries: WordEntry[]) => void
  resetToSample: () => void
}

function normalizeEntries(entries: WordEntry[]): WordEntry[] {
  const map = new Map<string, WordEntry>()
  for (const e of entries) {
    const w = e.word.trim()
    if (!w) continue
    const key = w.toLowerCase()
    if (!map.has(key)) {
      map.set(key, { ...e, id: e.id || key, word: w })
    }
  }
  return [...map.values()].sort((a, b) => a.word.localeCompare(b.word))
}

function toSampleEntries(): WordEntry[] {
  return normalizeEntries(sampleWords.map((w) => ({ id: w.toLowerCase(), word: w })))
}

function loadFromStorage(): { words: WordEntry[]; source: WordSource } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { words: toSampleEntries(), source: "sample" }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return { words: toSampleEntries(), source: "sample" }
    const entries = parsed
      .map((x) => {
        if (typeof x === "string") return { id: x.toLowerCase(), word: x }
        if (x && typeof x === "object" && "word" in x && typeof (x as any).word === "string") {
          const w = (x as any).word as string
          return { id: w.toLowerCase(), word: w }
        }
        return null
      })
      .filter(Boolean) as WordEntry[]
    const normalized = normalizeEntries(entries)
    if (normalized.length === 0) return { words: toSampleEntries(), source: "sample" }
    return { words: normalized, source: "imported" }
  } catch {
    return { words: toSampleEntries(), source: "sample" }
  }
}

export const useWordStore = create<WordState>((set) => {
  const initial = typeof window === "undefined" ? { words: toSampleEntries(), source: "sample" as WordSource } : loadFromStorage()

  return {
    words: initial.words,
    source: initial.source,
    setImportedWords: (entries) => {
      const normalized = normalizeEntries(entries)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized.map((w) => w.word)))
      set({ words: normalized, source: "imported" })
    },
    resetToSample: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({ words: toSampleEntries(), source: "sample" })
    },
  }
})

