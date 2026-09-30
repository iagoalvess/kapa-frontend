import { useSyncExternalStore } from 'react'
import { TAMANHO_DA_PAGINA_LOCAL } from '@/lib/paginar'

/** O `lg` do Tailwind: abaixo dele é o celular, com a barra inferior (Sprint 41). */
const CONSULTA = '(min-width: 64rem)'

/** Registros por página no celular (P7 da Sprint 41): a lista vira lista, e dez linhas já são várias telas. */
const TAMANHO_DA_PAGINA_NO_CELULAR = 5

const consulta = () => globalThis.matchMedia?.(CONSULTA)

const assinar = (aoMudar: () => void) => {
  const midia = consulta()
  midia?.addEventListener('change', aoMudar)
  return () => midia?.removeEventListener('change', aoMudar)
}

/**
 * Se a tela é a do computador (`lg` ou mais) — o que o CSS já resolve sozinho com `lg:`/`max-lg:`, e
 * só entra aqui quando a decisão muda dado (quantos por página) ou quantas cópias de uma peça existem.
 *
 * Sem `matchMedia` (jsdom), é computador: os testes seguem com o tamanho de página de sempre.
 */
export function useTelaGrande() {
  return useSyncExternalStore(
    assinar,
    () => consulta()?.matches ?? true,
    () => true,
  )
}

/**
 * Registros por página: o da tela no computador, cinco no celular.
 *
 * A página continua na URL; o que muda com a largura é só o tamanho dela.
 *
 * @param noComputador O tamanho de sempre da lista.
 */
export function useTamanhoDaPagina(noComputador = TAMANHO_DA_PAGINA_LOCAL) {
  return useTelaGrande() ? noComputador : TAMANHO_DA_PAGINA_NO_CELULAR
}
