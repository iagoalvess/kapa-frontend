import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/config/planos'
import { api } from '@/lib/http/cliente'
import type { PlanoDaTurma } from '@/types/plano'
import { CHAVE_DA_FORMATURA_ATUAL } from './useFormaturaAtual'
import { usePlanosDoCatalogo } from './usePlanosDoCatalogo'
import { useFormaturaAtiva } from './useSessao'

/**
 * O plano que vale para a turma agora e o que ele libera (Sprint 45).
 *
 * É o único lugar da tela que sabe de plano. Mora em `hooks/` porque o menu, as rotas e as consultas de
 * várias features perguntam a ele — e uma feature não importa de outra.
 *
 * A chave fica debaixo da da formatura atual: quem já invalida a formatura quando a assinatura muda (o
 * retorno do checkout) invalida o plano junto, sem saber dele.
 *
 * As duas perguntas são diferentes de propósito, e as duas respondem `false` enquanto o plano carrega:
 * - `inclui` libera a consulta de uma área só depois de saber que ela está no plano — a turma gratuita
 *   deixa de disparar os 403 que viravam erro vermelho na tela.
 * - `bloqueia` tranca só depois de saber que ela está fora — a turma que pagou não vê o cadeado piscar.
 *
 * Se a leitura do plano falhar, as duas liberam: quem recusa de verdade é a API, e sem plano a tela não
 * tem por que esconder a turma inteira de quem pagou.
 */
export function usePlanoDaTurma() {
  const { formaturaId } = useFormaturaAtiva()

  const consulta = useQuery({
    queryKey: [...CHAVE_DA_FORMATURA_ATUAL, formaturaId, 'plano'],
    queryFn: ({ signal }) => api.get<PlanoDaTurma>('/api/v1/formaturas/atual/plano', { signal }),
    enabled: formaturaId !== null,
  })

  const plano = consulta.data
  const temOModulo = (modulo: Modulo) => plano?.modulos.includes(modulo) === true

  return {
    plano,
    carregando: consulta.isPending && formaturaId !== null,
    inclui: (modulo: Modulo) => consulta.isError || temOModulo(modulo),
    bloqueia: (modulo: Modulo) => plano !== undefined && !temOModulo(modulo),
  }
}

/**
 * O plano mais barato do catálogo que libera o módulo — o "é do plano Premium" do cadeado.
 *
 * Lido do catálogo, e não escrito na tela: o que cada plano libera é dado, e mudar a linha do catálogo
 * muda a frase junto. Nulo enquanto o catálogo carrega, ou se nenhum plano à venda libera o módulo.
 *
 * @param modulo Código do módulo.
 */
export function usePlanoQueLibera(modulo: Modulo) {
  const { data: planos } = usePlanosDoCatalogo()

  return (
    planos
      ?.filter((plano) => plano.modulos.includes(modulo))
      .toSorted((a, b) => a.preco_em_centavos - b.preco_em_centavos)[0] ?? null
  )
}

/**
 * Se o atalho de uma tela que mora **dentro** de outra ainda precisa do menu (Sprint 45).
 *
 * Um atalho secundário de Gestão pode virar card dentro de uma tela que o abriga — a Portaria e a Loja
 * moram em A festa e em Pedidos. O problema é o plano: a tela que abriga pode estar fora dele, e aí ela
 * não monta (o `<ExigeModulo>` mostra a vitrine) e leva o card embora. A regra é:
 *
 * - **A tela que abriga está no plano** → o card é o caminho; o atalho some do menu.
 * - **A tela que abriga está fora do plano** → o atalho fica no menu, que continua levando à vitrine.
 * - **Ainda não se sabe** (carregando, ou erro na leitura) → o atalho fica no menu. Perder a porta é
 *   pior que vê-la por um instante; é a mesma escolha "fail-open" de {@link usePlanoDaTurma}.
 *
 * O gate de verdade continua na API (`[ExigeModulo]`); isto é navegação.
 *
 * @param moduloDaTelaQueAbriga Módulo que libera a tela onde o card mora. Sem gate (Pedidos), o
 *   atalho nunca volta ao menu.
 */
export function useAtalhoNoMenu(moduloDaTelaQueAbriga: Modulo) {
  const { plano } = usePlanoDaTurma()

  return !plano?.modulos.includes(moduloDaTelaQueAbriga)
}
