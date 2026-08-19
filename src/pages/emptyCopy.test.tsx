import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

it('uses spec empty copy on History and Summary', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByTestId('app-ready')
  await user.click(screen.getAllByRole('link', { name: 'History' })[0])
  expect(screen.getByText('Nothing recorded yet.')).toBeInTheDocument()
  await user.click(screen.getAllByRole('link', { name: 'Summary' })[0])
  expect(screen.getByText('No expenses in this period.')).toBeInTheDocument()
})
