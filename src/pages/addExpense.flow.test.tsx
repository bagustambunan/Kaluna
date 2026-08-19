import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import * as storage from '../lib/storage'
import { formatRupiah } from '../lib/format'

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

it('records from the well without an add button', async () => {
  const user = userEvent.setup({ delay: null })
  render(<App />)
  await screen.findByTestId('app-ready')
  const form = screen.getByTestId('expense-form')
  await user.type(form.querySelector('input[placeholder="0"]') as HTMLInputElement, '25000')
  await user.click(screen.getByRole('button', { name: /Food/ }))
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Saved')).toBeInTheDocument()
  const amount = formatRupiah(25000).replace(/\u00a0/g, ' ')
  expect(screen.getAllByText(amount).length).toBeGreaterThan(0)
})
