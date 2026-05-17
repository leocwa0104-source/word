import { useEffect, useMemo, useState } from "react"
import { LogOut, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import AuthDialog from "@/components/AuthDialog"
import { useAuthStore } from "@/stores/useAuthStore"
import { useShallow } from "zustand/shallow"

export default function AuthControls() {
  const { isReady, user, bootstrap, logout } = useAuthStore(
    useShallow((s) => ({
      isReady: s.isReady,
      user: s.user,
      bootstrap: s.bootstrap,
      logout: s.logout,
    })),
  )

  const [open, setOpen] = useState<null | "login" | "register">(null)

  useEffect(() => {
    if (isReady) return
    void bootstrap()
  }, [bootstrap, isReady])

  const short = useMemo(() => {
    const u = user?.username ?? ""
    if (!u) return ""
    return u.length > 12 ? `${u.slice(0, 12)}…` : u
  }, [user?.username])

  if (!isReady) {
    return (
      <div className="h-9 w-[136px] rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.55)]" />
    )
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-3 py-2 text-sm">
            <UserRound className="h-4 w-4 text-[rgb(var(--ink2))]" />
            <div className="max-w-[140px] truncate">{short}</div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-3 text-sm transition hover:bg-[rgba(var(--paper2),0.9)]"
          >
            <LogOut className="h-4 w-4" />
            退出
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen("login")}
            className="inline-flex h-9 items-center justify-center rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] bg-[rgba(var(--paper2),0.65)] px-4 text-sm transition hover:bg-[rgba(var(--paper2),0.9)]"
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setOpen("register")}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full border border-[rgba(var(--hairline),var(--hairline-a))] px-4 text-sm transition",
              "bg-[rgba(var(--accent),0.85)] text-[rgb(var(--paper))] hover:bg-[rgba(var(--accent),0.95)]",
            )}
          >
            注册
          </button>
        </div>
      )}

      <AuthDialog
        open={open === "login"}
        mode="login"
        onClose={() => {
          setOpen(null)
        }}
      />
      <AuthDialog
        open={open === "register"}
        mode="register"
        onClose={() => {
          setOpen(null)
        }}
      />
    </>
  )
}
