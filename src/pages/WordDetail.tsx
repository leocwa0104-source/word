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
    <div className="mx-auto max-w-4xl px-4 py-8">
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
              <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
                单词详情页用于承载：释义/例句/创意记忆内容流（下一步接后端与社区功能）。
              </div>
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

        <div className="border-t border-[rgba(var(--hairline),var(--hairline-a))] px-6 py-10 text-center sm:px-8">
          <div className="font-[var(--font-display)] text-[18px] font-[650]">创意记忆内容：即将上线</div>
          <div className="mt-2 text-sm text-[rgb(var(--ink2))]">
            你可以先把主页“词卡墙”跑起来，并通过导入自己的词表来验证性能与体验。
          </div>
        </div>
      </div>
    </div>
  )
}
