import { create } from "zustand"
import { sampleWords } from "@/data/sampleWords"
import type { WordEntry } from "@/types/word"

type WordState = {
  words: WordEntry[]
  setWords: (entries: WordEntry[]) => void
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

export const useWordStore = create<WordState>((set) => {
  return {
    words: toSampleEntries(),
    setWords: (entries) => set({ words: normalizeEntries(entries) }),
  }
})
