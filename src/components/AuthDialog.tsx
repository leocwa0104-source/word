import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/useAuthStore"

type Mode = "login" | "register"

type Props = {
  open: boolean
  mode: Mode
  onClose: () => void
}

function errorText(code: string): string {
  if (code === "invalid_username") return "用户名需为 3-32 位字母/数字/下划线"
  if (code === "invalid_password") return "密码至少 6 位"
  if (code === "user_exists") return "用户名已存在"
  if (code === "invalid_credentials") return "用户名或密码错误"
  if (code === "network_error") return "网络异常，请稍后重试"
  return "操作失败，请重试"
}

export default function AuthDialog({ open, mode, onClose }: Props) {
  const register = useAuthStore((s) => s.register)
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSubmitting(false)
    setError(null)
    setPassword("")
    setConfirm("")
  }, [open, mode])

  const title = useMemo(() => (mode === "login" ? "登录" : "注册"), [mode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(var(--shadow),0.45)] backdrop-blur-sm"
        aria-label="关闭"
      />
      <div className="relative flex h-full items-center justify-center px-4">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper),0.92)] shadow-[0_24px_80px_rgba(var(--shadow),0.55)]">
          <div className="flex items-center justify-between border-b border-[rgba(var(--hairline),var(--hairline-a))] px-6 py-4">
            <div className="font-[var(--font-display)] text-[18px] font-[650]">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] transition hover:bg-[rgba(var(--paper2),0.9)]"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            className="px-6 py-5"
            onSubmit={async (e) => {
              e.preventDefault()
              if (submitting) return
              setError(null)

              const u = username.trim()
              if (!u) {
                setError("invalid_username")
                return
              }
              if (password.length < 6) {
                setError("invalid_password")
                return
              }
              if (mode === "register" && password !== confirm) {
                setError("confirm_mismatch")
                return
              }

              setSubmitting(true)
              const res = mode === "register" ? await register({ username: u, password }) : await login({ username: u, password })
              setSubmitting(false)
              if (!res.ok) {
                setError("error" in res ? res.error : "login_failed")
                return
              }
              onClose()
            }}
          >
            <div className="grid gap-3">
              <label className="grid gap-1">
                <div className="text-xs text-[rgb(var(--ink2))]">用户名</div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.72)] px-4 py-3 text-sm outline-none focus:bg-[rgba(var(--paper2),0.92)]"
                  placeholder="例如 leocw"
                  autoComplete="username"
                />
              </label>

              <label className="grid gap-1">
                <div className="text-xs text-[rgb(var(--ink2))]">密码</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.72)] px-4 py-3 text-sm outline-none focus:bg-[rgba(var(--paper2),0.92)]"
                  type="password"
                  placeholder="至少 6 位"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </label>

              {mode === "register" ? (
                <label className="grid gap-1">
                  <div className="text-xs text-[rgb(var(--ink2))]">确认密码</div>
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.72)] px-4 py-3 text-sm outline-none focus:bg-[rgba(var(--paper2),0.92)]"
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              <div
                className={cn(
                  "rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)] px-4 py-3 text-xs text-[rgb(var(--ink2))]",
                  error ? "block" : "hidden",
                )}
              >
                {error === "confirm_mismatch" ? "两次密码不一致" : error ? errorText(error) : ""}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "mt-1 inline-flex items-center justify-center rounded-2xl border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--accent),0.85)] px-4 py-3 text-sm font-[650] text-[rgb(var(--paper))] shadow-[0_18px_50px_rgba(var(--shadow),0.35)] transition hover:bg-[rgba(var(--accent),0.95)]",
                  submitting ? "opacity-70" : "",
                )}
              >
                {submitting ? "处理中…" : title}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
