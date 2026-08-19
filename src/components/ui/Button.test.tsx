import { render, screen } from '@testing-library/react'
import { Button } from './Button'

it('uses pen for primary and stamp for danger', () => {
  const { rerender } = render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' }).className).toMatch(/bg-pen/)
  rerender(<Button variant="danger">Delete</Button>)
  expect(screen.getByRole('button', { name: 'Delete' }).className).toMatch(/bg-stamp/)
})
