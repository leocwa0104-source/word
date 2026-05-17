import { ArrowLeft, Bookmark, CheckCircle2 } from "lucide-react"
import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useWordStore } from "@/stores/useWordStore"
import AuthControls from "@/components/AuthControls"

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
                <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
                  暂无释义。后续可接入词典数据源，或由社区用户贡献释义/例句。
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.55)] p-5 shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))]">
                <div className="font-[var(--font-display)] text-[16px] font-[650]">记忆方法</div>
                <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
                  暂无内容。这里将展示联想法、词根词缀、谐音、图像化等创意记忆卡片。
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.55)] p-5 shadow-[0_16px_40px_rgba(var(--shadow),var(--shadow-a))]">
                <div className="font-[var(--font-display)] text-[16px] font-[650]">应用</div>
                <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
                  暂无内容。这里将展示常用搭配、同反义词、真题语境、造句练习等应用模块。
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
