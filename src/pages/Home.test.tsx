import { render, screen } from '@testing-library/react'
import App from '../App'
import * as storage from '../lib/storage'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  storage.clear()
  storage.initDefaultData()
})

it('shows Today nav and the compose well, not a FAB add control', async () => {
  render(<App />)
  await screen.findByTestId('app-ready')
  expect(screen.getAllByRole('link', { name: 'Today' }).length).toBeGreaterThan(0)
  expect(screen.getByTestId('expense-form')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Add Expense' })).not.toBeInTheDocument()
  expect(screen.getByText('What did you spend?')).toBeInTheDocument()
})
