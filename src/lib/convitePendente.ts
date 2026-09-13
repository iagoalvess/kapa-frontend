const CHAVE = 'kapa:convite-pendente'

/**
 * Convite aberto por quem ainda não tinha sessão, guardado enquanto a pessoa cria conta ou entra.
 *
 * `sessionStorage`, e não o `state` da navegação: o `state` se perde quando a pessoa pula do
 * cadastro para o login (ou volta), e o convite sumiria no meio do caminho. Fica só nesta aba e
 * morre com ela. O token do convite não é credencial de sessão — é o mesmo valor que já está na
 * URL da aba.
 *
 * Armazenamento bloqueado (aba anônima de alguns navegadores) não quebra nada: o convite só deixa
 * de ser retomado sozinho, e o link continua funcionando.
 */
export const convitePendente = {
  guardar(token: string) {
    try {
      sessionStorage.setItem(CHAVE, token)
    } catch {
      // Sem armazenamento, a pessoa volta pelo link.
    }
  },

  ler(): string | null {
    try {
      return sessionStorage.getItem(CHAVE)
    } catch {
      return null
    }
  },

  descartar() {
    try {
      sessionStorage.removeItem(CHAVE)
    } catch {
      // Nada guardado, nada a descartar.
    }
  },
}
