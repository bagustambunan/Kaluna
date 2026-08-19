import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposeWell } from './ComposeWell'
import type { ComposeWellProps } from './ComposeWell'
import { DEFAULT_CATEGORIES } from '../../constants/defaults'
import { formatDateStr } from '../../lib/date'

const categories = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }))
const shortcuts = [{
  id: 'sc1', label: 'Office lunch', amount: 25000,
  categoryId: 'cat-default-1', note: 'Office lunch', order: 0,
}]

function setup(override: Partial<ComposeWellProps> = {}) {
  const onSave = vi.fn()
  const onCancelEdit = vi.fn()
  const onComposeFocusChange = vi.fn()
  render(
    <ComposeWell
      categories={categories}
      shortcuts={shortcuts}
      selectedDate="2026-08-19"
      autoFocusAmount={false}
      onSave={onSave}
      onCancelEdit={onCancelEdit}
      onComposeFocusChange={onComposeFocusChange}
      {...override}
    />,
  )
  return { onSave, onCancelEdit, onComposeFocusChange }
}

it('disables Save until amount and category are set', () => {
  setup()
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})

it('saves manual entry to the selected date', async () => {
  const user = userEvent.setup()
  const { onSave } = setup()
  await user.type(screen.getByPlaceholderText('0'), '25000')
  await user.click(screen.getByRole('button', { name: /Food/ }))
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).toHaveBeenCalledWith({
    amount: 25000,
    categoryId: 'cat-default-1',
    note: '',
    date: '2026-08-19',
  })
})

it('saves a shortcut in one tap', async () => {
  const user = userEvent.setup()
  const { onSave } = setup()
  await user.click(screen.getByRole('button', { name: 'Office lunch' }))
  expect(onSave).toHaveBeenCalledTimes(1)
  expect(onSave).toHaveBeenCalledWith({
    amount: 25000,
    categoryId: 'cat-default-1',
    note: 'Office lunch',
    date: '2026-08-19',
  })
})

it('resets to add defaults when leaving edit mode', () => {
  const { rerender } = render(
    <ComposeWell
      categories={categories}
      shortcuts={shortcuts}
      selectedDate="2026-08-19"
      editingExpense={{
        id: 'e1', amount: 1000, categoryId: 'cat-default-1',
        note: 'x', date: '2026-08-01',
      }}
      autoFocusAmount={false}
      onSave={vi.fn()}
      onCancelEdit={vi.fn()}
      onComposeFocusChange={vi.fn()}
    />,
  )

  rerender(
    <ComposeWell
      categories={categories}
      shortcuts={shortcuts}
      selectedDate="2026-08-19"
      autoFocusAmount={false}
      onSave={vi.fn()}
      onCancelEdit={vi.fn()}
      onComposeFocusChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  expect(screen.queryByLabelText('Date')).not.toBeInTheDocument()
})

it('shows a date field only while editing', () => {
  const { unmount } = render(
    <ComposeWell
      categories={categories}
      shortcuts={shortcuts}
      selectedDate="2026-08-19"
      autoFocusAmount={false}
      onSave={vi.fn()}
      onCancelEdit={vi.fn()}
      onComposeFocusChange={vi.fn()}
    />,
  )
  expect(screen.queryByLabelText('Date')).not.toBeInTheDocument()
  unmount()
  render(
    <ComposeWell
      categories={categories}
      shortcuts={shortcuts}
      selectedDate="2026-08-19"
      editingExpense={{
        id: 'e1', amount: 1000, categoryId: 'cat-default-1',
        note: 'x', date: '2026-08-01',
      }}
      autoFocusAmount={false}
      onSave={vi.fn()}
      onCancelEdit={vi.fn()}
      onComposeFocusChange={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('Date')).toBeInTheDocument()
})

it('reports amount focus', async () => {
  const user = userEvent.setup()
  const { onComposeFocusChange } = setup()
  await user.click(screen.getByPlaceholderText('0'))
  expect(onComposeFocusChange).toHaveBeenCalledWith(true)
})

it('caps the edit date input at today', () => {
  setup({
    editingExpense: {
      id: 'e1', amount: 1000, categoryId: 'cat-default-1',
      note: 'x', date: '2026-08-01',
    },
  })
  expect(screen.getByLabelText('Date')).toHaveAttribute('max', formatDateStr(new Date()))
})

it('falls back to the expense date when the edit date is cleared', async () => {
  const user = userEvent.setup()
  const { onSave } = setup({
    editingExpense: {
      id: 'e1', amount: 1000, categoryId: 'cat-default-1',
      note: 'x', date: '2026-08-01',
    },
  })
  await user.clear(screen.getByLabelText('Date'))
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).toHaveBeenCalledWith({
    amount: 1000,
    categoryId: 'cat-default-1',
    note: 'x',
    date: '2026-08-01',
  })
})

it('does not unfocus when blur relatedTarget is null', () => {
  const { onComposeFocusChange } = setup()
  const amount = screen.getByPlaceholderText('0')
  fireEvent.focus(amount)
  expect(onComposeFocusChange).toHaveBeenCalledWith(true)
  onComposeFocusChange.mockClear()
  fireEvent.blur(amount, { relatedTarget: null })
  expect(onComposeFocusChange).not.toHaveBeenCalled()
})
