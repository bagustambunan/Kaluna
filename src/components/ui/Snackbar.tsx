import { useEffect } from 'react'

interface SnackbarProps {
  message: { text: string; undoFn?: () => void } | null
  onDismiss: () => void
  duration?: number
}

export function Snackbar({ message, onDismiss, duration }: SnackbarProps) {
  const ms = duration ?? (message?.undoFn ? 5000 : 2000)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, ms)
    return () => clearTimeout(t)
  }, [message, ms, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-6">
      <div className="flex items-center gap-3 bg-[#17345e] text-white text-sm px-4 py-3 rounded-2xl shadow-[0_14px_30px_rgba(23,52,94,.28)]">
        <span>{message.text}</span>
        {message.undoFn && (
          <button
            onClick={() => { message.undoFn!(); onDismiss() }}
            className="font-bold text-blue-200 hover:text-white underline underline-offset-2"
          >
            Urungkan
          </button>
        )}
      </div>
    </div>
  )
}
