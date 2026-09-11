/** Aparência escolhida pelo usuário. */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'tema'

/**
 * Tema a aplicar: o escolhido antes, ou o do sistema operacional na primeira visita.
 */
export function temaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // Navegação privada ou armazenamento bloqueado: cai na preferência do sistema.
  }

  // O '?.' não é paranoia: matchMedia não existe em jsdom nem em renderização fora do navegador.
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

/**
 * Aplica o tema na raiz do documento e o guarda.
 *
 * Chamado em `main.tsx` **antes** do primeiro render: aplicar depois produz o flash branco de
 * meio segundo que todo mundo reconhece como site mal feito.
 *
 * @param tema Tema a aplicar.
 */
export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'escuro')

  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento, a escolha vale só nesta aba.
  }
}
