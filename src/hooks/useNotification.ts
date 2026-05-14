import { useCallback } from 'react'
import type { Budgets } from '../types'
import { getBudgetStatus } from '../lib/budget'
import * as storage from '../lib/storage'
import { getWeekNumber, getMonthKey } from '../lib/date'

type NotifKey = string

function wasNotifSent(key: NotifKey): boolean {
  const sent = storage.get<Record<string, true>>(storage.KEYS.notifSent) ?? {}
  return !!sent[key]
}

function markNotifSent(key: NotifKey): void {
  const sent = storage.get<Record<string, true>>(storage.KEYS.notifSent) ?? {}
  sent[key] = true
  storage.set(storage.KEYS.notifSent, sent)
}

export function pruneOldNotifKeys(): void {
  const sent = storage.get<Record<string, true>>(storage.KEYS.notifSent)
  if (!sent) return
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const cutoff = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  const pruned: Record<string, true> = {}
  for (const key of Object.keys(sent)) {
    const parts = key.split('_')
    const period = parts[parts.length - 1]
    if (period && period >= cutoff) pruned[key] = true
  }
  storage.set(storage.KEYS.notifSent, pruned)
}

function sendNotif(title: string, body: string, key: NotifKey, onInApp: (msg: string) => void) {
  if (wasNotifSent(key)) return
  markNotifSent(key)

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  } else {
    onInApp(`${title}: ${body}`)
  }
}

export function useNotification() {
  const checkBudget = useCallback((
    spent: number,
    budgets: Budgets,
    period: 'weekly' | 'monthly',
    onInApp: (msg: string) => void
  ) => {
    const now = new Date()
    const periodKey = period === 'weekly' ? getWeekNumber(now) : getMonthKey(now)
    const budget = period === 'weekly' ? budgets.weekly : budgets.monthly
    const status = getBudgetStatus(spent, budget, budgets.alertThresholdPct)
    if (!status) return

    const label = period === 'weekly' ? 'weekly' : 'monthly'

    if (status.status === 'over') {
      const key = `${period}_over_${periodKey}`
      sendNotif('Over Budget', `You're over your ${label} budget`, key, onInApp)
    } else if (status.status === 'warning') {
      const threshold = Math.round(budgets.alertThresholdPct)
      const key = `${period}_${threshold}_${periodKey}`
      sendNotif('Budget Warning', `You've used ${threshold}% of your ${label} budget`, key, onInApp)
    } else if (status.pct >= 100) {
      const key = `${period}_100_${periodKey}`
      sendNotif('Budget Reached', `${label.charAt(0).toUpperCase() + label.slice(1)} budget reached`, key, onInApp)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    return await Notification.requestPermission()
  }, [])

  return { checkBudget, requestPermission }
}
