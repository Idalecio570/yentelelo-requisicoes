import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn, formatRelativeTime } from "@/lib/utils"
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications"

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unread = notifications.filter((n) => !n.lida).length
  const visible = notifications.slice(0, 10)

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleClick(notif: typeof notifications[0]) {
    if (!notif.lida) markRead.mutate(notif.id)
    if (notif.requisition_id) {
      navigate(`/requisitions/${notif.requisition_id}`)
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notificações</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-red-600 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {visible.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                Nenhuma notificação
              </p>
            ) : (
              visible.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                    !n.lida && "bg-red-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.lida && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    )}
                    <div className={cn("flex-1", n.lida && "ml-4")}>
                      <p className="text-xs font-medium text-gray-900 leading-snug">
                        {n.titulo}
                      </p>
                      {n.mensagem && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.mensagem}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">
                Mostrando 10 de {notifications.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
