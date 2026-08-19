import type { Page } from '@playwright/test'

export async function clearAppData(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('kaluna_'))
      .forEach(k => localStorage.removeItem(k))
  })
  await page.reload()
  await page.waitForSelector('[data-testid="app-ready"]')
}

export async function addExpense(
  page: Page,
  amount: number,
  categoryName: string,
  note = '',
) {
  await page.getByRole('link', { name: 'Today' }).click()
  const form = page.getByTestId('expense-form')
  await form.waitFor({ state: 'visible' })
  await form.getByPlaceholder('0').fill(String(amount))
  await form.getByText(categoryName, { exact: true }).first().click()
  if (note) {
    await form.getByPlaceholder('Add a note (optional)').fill(note)
  }
  await form.getByRole('button', { name: 'Save' }).click()
  await page.getByText('Saved').waitFor({ state: 'visible', timeout: 5000 })
}
