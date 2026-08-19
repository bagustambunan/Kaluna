import { renderHook } from '@testing-library/react'
import { useNotification } from './useNotification'
import * as storage from '../lib/storage'

const budgets = { weekly: 100_000, monthly: 400_000, alertThresholdPct: 75 }

beforeEach(() => {
  storage.clear()
  storage.initDefaultData()
})

it('sends over-budget copy for the period', () => {
  const onInApp = vi.fn()
  const { result } = renderHook(() => useNotification())
  result.current.checkBudget(150_000, budgets, 'weekly', onInApp)
  expect(onInApp).toHaveBeenCalledWith('Over Budget: Weekly budget exceeded.')
  result.current.checkBudget(500_000, budgets, 'monthly', onInApp)
  expect(onInApp).toHaveBeenCalledWith('Over Budget: Monthly budget exceeded.')
})

it('sends warning copy with the threshold', () => {
  const onInApp = vi.fn()
  const { result } = renderHook(() => useNotification())
  result.current.checkBudget(80_000, budgets, 'weekly', onInApp)
  expect(onInApp).toHaveBeenCalledWith('Budget Warning: Weekly budget is at 75%.')
  result.current.checkBudget(320_000, budgets, 'monthly', onInApp)
  expect(onInApp).toHaveBeenCalledWith('Budget Warning: Monthly budget is at 75%.')
})
