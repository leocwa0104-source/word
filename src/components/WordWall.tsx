import { useEffect, useMemo, useRef, useState } from "react"
import type { WordEntry } from "@/types/word"
import WordCard from "@/components/WordCard"

type Props = {
  entries: WordEntry[]
  onOpen: (entry: WordEntry) => void
  onVisibleCountChange?: (count: number) => void
}

const INITIAL_COUNT = 240
const STEP = 180

export default function WordWall({ entries, onOpen, onVisibleCountChange }: Props) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(INITIAL_COUNT, entries.length))
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const next = Math.min(INITIAL_COUNT, entries.length)
    setVisibleCount(next)
    onVisibleCountChange?.(next)
  }, [entries.length, onVisibleCountChange])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const ob = new IntersectionObserver(
      (items) => {
        const hit = items.some((i) => i.isIntersecting)
        if (!hit) return
        setVisibleCount((c) => {
          const next = Math.min(c + STEP, entries.length)
          onVisibleCountChange?.(next)
          return next
        })
      },
      { rootMargin: "900px" },
    )

    ob.observe(el)
    return () => ob.disconnect()
  }, [entries.length, onVisibleCountChange])

  const slice = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      {entries.length === 0 ? (
        <div className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-6 py-10 text-center shadow-[0_18px_40px_rgba(var(--shadow),var(--shadow-a))]">
          <div className="font-[var(--font-display)] text-[18px] font-[650]">没有匹配结果</div>
          <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
            试试缩短关键词，或换个首字母。
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {slice.map((entry, idx) => (
              <WordCard key={entry.id} entry={entry} index={idx} onOpen={onOpen} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center">
            {visibleCount < entries.length ? (
              <button
                type="button"
                className="rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-5 py-2 text-sm shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))] transition hover:bg-[rgba(var(--paper2),0.9)]"
                onClick={() => {
                  setVisibleCount((c) => {
                    const next = Math.min(c + STEP, entries.length)
                    onVisibleCountChange?.(next)
                    return next
                  })
                }}
              >
                加载更多
              </button>
            ) : (
              <div className="text-xs text-[rgb(var(--ink2))]">已加载全部</div>
            )}
          </div>
          <div ref={sentinelRef} className="h-2" />
        </>
      )}
    </div>
  )
}
