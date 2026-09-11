import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './msw/server'

beforeAll(() => {
  // 'error' em vez de 'warn': requisição não declarada é teste mentindo sobre o que exercita.
  servidor.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  servidor.resetHandlers()
  localStorage.clear()
})

afterAll(() => {
  servidor.close()
})
