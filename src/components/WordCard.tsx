import { ArrowUpRight } from "lucide-react"
import type { WordEntry } from "@/types/word"

type Props = {
  entry: WordEntry
  index: number
  onOpen: (entry: WordEntry) => void
}

export default function WordCard({ entry, index, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="group relative flex min-h-[88px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-4 py-3 text-left shadow-[0_10px_22px_rgba(var(--shadow),var(--shadow-a))] transition will-change-transform hover:-translate-y-0.5 hover:bg-[rgba(var(--paper2),0.9)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-[var(--font-display)] text-[18px] font-[650] tracking-[0.01em]">
            {entry.word}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[rgba(var(--ink2),0.9)]">
            <span className="rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.7)] px-2 py-0.5">
              #{String(index + 1).padStart(4, "0")}
            </span>
            <span className="rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.35)] px-2 py-0.5">
              {entry.word.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.25)] text-[rgb(var(--ink2))] transition group-hover:bg-[rgba(var(--paper),0.55)]">
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-[rgba(var(--ink),0.08)]">
          <div className="h-full w-[38%] rounded-full bg-[rgba(var(--accent),0.8)] transition group-hover:w-[68%]" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[rgba(var(--accent2),0.14)] blur-2xl" />
      </div>
    </button>
  )
}
