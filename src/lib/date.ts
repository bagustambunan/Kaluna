import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns'
import type { DateRange, Expense, WeekStartDay } from '../types'

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function formatDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getWeekRange(date: Date, weekStartDay: WeekStartDay): DateRange {
  const weekStartsOn = weekStartDay === 'sunday' ? 0 : 1
  return {
    start: formatDateStr(startOfWeek(date, { weekStartsOn })),
    end:   formatDateStr(endOfWeek(date,   { weekStartsOn })),
  }
}

export function getMonthRange(date: Date): DateRange {
  return {
    start: formatDateStr(startOfMonth(date)),
    end:   formatDateStr(endOfMonth(date)),
  }
}

export function isInRange(dateStr: string, range: DateRange): boolean {
  const date = parseDate(dateStr)
  const start = parseDate(range.start)
  const end = parseDate(range.end)
  return isWithinInterval(date, { start, end })
}

export function filterByRange(expenses: Expense[], range: DateRange): Expense[] {
  return expenses.filter(e => isInRange(e.date, range))
}

export function groupByDay(expenses: Expense[], range: DateRange): Record<string, Expense[]> {
  const days = eachDayOfInterval({ start: parseDate(range.start), end: parseDate(range.end) })
  const result: Record<string, Expense[]> = {}
  days.forEach(d => { result[formatDateStr(d)] = [] })
  expenses.forEach(e => {
    if (result[e.date] !== undefined) {
      result[e.date].push(e)
    }
  })
  return result
}

export function groupByCategory(expenses: Expense[]): Record<string, Expense[]> {
  const result: Record<string, Expense[]> = {}
  expenses.forEach(e => {
    if (!result[e.categoryId]) result[e.categoryId] = []
    result[e.categoryId].push(e)
  })
  return result
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseDate(dateStr), 'MMM d, yyyy')
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function formatWeekRange(range: DateRange): string {
  const start = parseDate(range.start)
  const end = parseDate(range.end)
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

export function getDayLabel(dateStr: string): string {
  return format(parseDate(dateStr), 'EEE')
}

export function getWeekNumber(date: Date): string {
  return format(date, "yyyy-'W'ww")
}

export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}
