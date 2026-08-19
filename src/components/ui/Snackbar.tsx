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
    <div className="fixed left-1/2 -translate-x-1/2 z-50 bottom-[var(--snack-offset,5.5rem)] md:bottom-6">
      <div className="flex items-center gap-3 bg-ink text-sheet text-sm px-4 py-2.5 rounded-lg shadow-lg">
        <span>{message.text}</span>
        {message.undoFn && (
          <button
            onClick={() => { message.undoFn!(); onDismiss() }}
            className="font-semibold text-pen hover:text-white underline underline-offset-2"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}
