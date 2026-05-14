const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount)
}

export function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10))
}

export function parseRupiahInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '')
  if (!digits) return 0
  return parseInt(digits, 10)
}

export function formatPct(pct: number): string {
  return `${Math.round(pct)}%`
}
