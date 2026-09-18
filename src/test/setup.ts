import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './msw/server'

beforeAll(() => {
  // 'error' em vez de 'warn': requisição não declarada é teste mentindo sobre o que exercita.
  servidor.listen({ onUnhandledRequest: 'error' })
})

// Mesma história do `popover`: o jsdom esconde o elemento e não implementa os métodos que o
// mostram. O `toggle` vai junto porque é por ele que o componente sabe que o balão fechou.
HTMLElement.prototype.showPopover ??= function abrirBalao(this: HTMLElement) {
  this.style.display = 'block'
  this.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }))
}
HTMLElement.prototype.hidePopover ??= function fecharBalao(this: HTMLElement) {
  this.style.display = 'none'
  this.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }))
}

// O jsdom não implementa ResizeObserver, e sem ele toda tela com `CaixaRolavel` estoura no teste.
// Nunca chama de volta: no jsdom nada tem tamanho, e a seta de "tem mais" só existe no navegador.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// O jsdom desenha o `<dialog>` e não implementa os métodos que o abrem. Sem estas três linhas,
// toda tela que usa diálogo nativo — a gaveta do menu, a busca do topo — estoura no teste com
// "showModal is not a function", que não é defeito nenhum do código.
HTMLDialogElement.prototype.showModal ??= function abrir(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.show ??= function abrirSemFundo(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function fechar(this: HTMLDialogElement) {
  this.open = false
  this.dispatchEvent(new Event('close'))
}

afterEach(() => {
  cleanup()
  servidor.resetHandlers()
  localStorage.clear()
})

afterAll(() => {
  servidor.close()
})
