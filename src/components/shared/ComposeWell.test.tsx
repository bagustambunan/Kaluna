import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposeWell } from './ComposeWell'
import type { ComposeWellProps } from './ComposeWell'
import { DEFAULT_CATEGORIES } from '../../constants/defaults'

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
