import { useMemo } from "react"
import { Moon, Sun, Upload, RotateCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"

type Props = {
  query: string
  onQueryChange: (value: string) => void
  totalCount: number
  visibleCount: number
  onPickFile: (file: File) => void
  onReset: () => void
  source: "sample" | "imported"
}

export default function TopBar({
  query,
  onQueryChange,
  totalCount,
  visibleCount,
  onPickFile,
  onReset,
  source,
}: Props) {
  const { isDark, toggleTheme } = useTheme()

  const summary = useMemo(() => {
    const left = source === "imported" ? "已导入词表" : "示例词表"
    if (visibleCount >= totalCount) return `${left} · ${totalCount.toLocaleString()}`
    return `${left} · ${visibleCount.toLocaleString()}/${totalCount.toLocaleString()}`
  }, [source, totalCount, visibleCount])

  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.88)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <div className="min-w-0">
            <div className="truncate font-[var(--font-display)] text-[17px] font-[650] tracking-[0.01em]">
              单词创意记忆社区
            </div>
            <div className="truncate text-xs text-[rgb(var(--ink2))]">{summary}</div>
          </div>
        </div>

        <label
          className={cn(
            "group relative hidden w-[360px] items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.85)] px-3 py-2 shadow-[0_10px_24px_rgba(var(--shadow),var(--shadow-a))] transition",
            "md:flex",
          )}
        >
          <Search className="h-4 w-4 text-[rgb(var(--ink2))]" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索单词…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[rgba(var(--ink2),0.65)]"
          />
          <div className="pointer-events-none absolute -bottom-3 left-10 hidden select-none rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.9)] px-2 py-0.5 text-[10px] text-[rgb(var(--ink2))] shadow-sm group-focus-within:block">
            支持包含匹配，输入越长越精确
          </div>
        </label>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-3 py-2 text-sm transition hover:bg-[rgba(var(--paper2),0.85)]">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">导入词表</span>
          <input
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPickFile(file)
              e.currentTarget.value = ""
            }}
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] px-3 py-2 text-sm transition",
            source === "imported"
              ? "bg-[rgba(var(--paper2),0.65)] hover:bg-[rgba(var(--paper2),0.85)]"
              : "cursor-not-allowed bg-[rgba(var(--paper2),0.25)] text-[rgba(var(--ink2),0.6)]",
          )}
          disabled={source !== "imported"}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">重置</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] p-2 transition hover:bg-[rgba(var(--paper2),0.85)]"
          aria-label="切换主题"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.75)] px-3 py-2 shadow-[0_12px_30px_rgba(var(--shadow),var(--shadow-a))]">
          <Search className="h-4 w-4 text-[rgb(var(--ink2))]" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索单词…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[rgba(var(--ink2),0.65)]"
          />
        </div>
      </div>
    </div>
  )
}
