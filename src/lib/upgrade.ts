import { api } from '@/lib/http/cliente'

/**
 * Avisa a API que a turma viu o paywall — a etapa do funil entre criar a turma e abrir o checkout.
 *
 * Fogo e esquece: analytics nunca trava nem quebra a tela, então a falha é engolida.
 *
 * @param motivo O código do diálogo, ou `modulo.{codigo}` para a área trancada.
 */
export function avisarPaywall(motivo: string) {
  api.post(`/api/v1/formaturas/atual/plano/paywall/${encodeURIComponent(motivo)}`).catch(() => {})
}

/**
 * Os códigos da API que querem dizer "o plano da turma não cobre isto" (Sprint 45).
 *
 * Nenhum deles se resolve tentando de novo, e todos se resolvem contratando — por isso viram o diálogo de
 * upgrade, e não um toast vermelho que só diz que deu errado.
 */
const CODIGOS_DE_UPGRADE = [
  'plano.modulo_nao_incluido',
  'convite.formatura_nao_contratada',
  'plano.limite_de_formandos',
] as const

/** Um código de {@link CODIGOS_DE_UPGRADE}. */
export type CodigoDeUpgrade = (typeof CODIGOS_DE_UPGRADE)[number]

/** O que o diálogo de upgrade mostra: o caso, pelo código, e a frase da API, que diz o número. */
interface PedidoDeUpgrade {
  codigo: CodigoDeUpgrade
  mensagem: string
}

/**
 * Diz se o código é um dos que viram diálogo de upgrade.
 *
 * @param codigo Código de erro da API.
 */
export function ehCodigoDeUpgrade(codigo: string): codigo is CodigoDeUpgrade {
  return (CODIGOS_DE_UPGRADE as readonly string[]).includes(codigo)
}

type Ouvinte = () => void

let atual: PedidoDeUpgrade | null = null
const ouvintes = new Set<Ouvinte>()

const avisar = () => {
  for (const ouvinte of ouvintes) ouvinte()
}

/**
 * O pedido de upgrade aberto na tela, fora do React.
 *
 * Fora porque quem pede não é componente: é `avisarErro` e `exibirErroNoFormulario`, que toda mutação já
 * usa. Com isso, qualquer 403 de plano que ainda chegue — cache velho, corrida, uma tela que não conferiu
 * antes — abre o mesmo diálogo sem que a tela precise saber. Quem desenha é o `DialogoDeUpgrade`, montado
 * uma vez no layout; `inscrever`/`estado` têm a forma do `useSyncExternalStore`.
 */
export const upgrade = {
  pedir(pedido: PedidoDeUpgrade) {
    atual = pedido
    avisarPaywall(pedido.codigo)
    avisar()
  },

  fechar() {
    atual = null
    avisar()
  },

  estado(): PedidoDeUpgrade | null {
    return atual
  },

  inscrever(ouvinte: Ouvinte) {
    ouvintes.add(ouvinte)
    return () => {
      ouvintes.delete(ouvinte)
    }
  },
}
