type Ouvinte = () => void

/**
 * O aviso da venda fechada aberto na tela (Sprint 61).
 *
 * Fora do React porque quem pede nem sempre é a tela de planos: `avisarErro` também o abre, quando uma
 * aba antiga tenta contratar e a API responde `assinatura.vendas_fechadas`. Quem desenha é o
 * `DialogoDeVendasFechadas`, montado uma vez no layout; `inscrever`/`estado` têm a forma do
 * `useSyncExternalStore`, como o `upgrade`.
 *
 * Não é caso de upgrade: a turma pode contratar quando a venda abrir, então nada aqui entra no funil do
 * paywall — `upgrade.pedir` registraria um motivo que não é falta de plano.
 */
interface PedidoDeVendasFechadas {
  /**
   * A frase que veio da API, quando a recusa chegou do servidor. Nula quando a própria tela já sabia
   * (leu `vendas_abertas` no plano) — aí o título sai da data do plano.
   */
  mensagem: string | null
}

let atual: PedidoDeVendasFechadas | null = null
const ouvintes = new Set<Ouvinte>()

const avisar = () => {
  for (const ouvinte of ouvintes) ouvinte()
}

/** O pedido de "a venda abre em…" da tela, fora do React. */
export const vendasFechadas = {
  /**
   * Abre o aviso.
   *
   * @param mensagem A frase da API, quando a recusa veio dela.
   */
  abrir(mensagem: string | null = null) {
    atual = { mensagem }
    avisar()
  },

  fechar() {
    atual = null
    avisar()
  },

  estado(): PedidoDeVendasFechadas | null {
    return atual
  },

  inscrever(ouvinte: Ouvinte) {
    ouvintes.add(ouvinte)
    return () => {
      ouvintes.delete(ouvinte)
    }
  },
}
