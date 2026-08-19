import { render, screen } from '@testing-library/react'
import { BudgetWhisper } from './BudgetWhisper'

it('renders over copy in stamp color', () => {
  render(
    <BudgetWhisper
      period="weekly"
      thresholdPct={75}
      status={{ spent: 120, budget: 100, pct: 120, status: 'over' }}
    />,
  )
  const el = screen.getByText('Weekly budget exceeded.')
  expect(el.className).toMatch(/text-stamp/)
})
