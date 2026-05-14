import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const triggerInstall = async () => {
    if (!promptRef.current) return
    await promptRef.current.prompt()
    promptRef.current = null
    setCanInstall(false)
  }

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !('onbeforeinstallprompt' in window)

  return { canInstall, triggerInstall, isIOS }
}
