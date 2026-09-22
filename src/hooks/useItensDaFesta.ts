import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { ItemDaFesta, ItemDaFestaDetalhe, MetaDaFesta } from '@/types/festa'

/**
 * As chaves de cache da festa.
 *
 * Ficam aqui, e não em `features/festa/hooks/chaves.ts`, porque quem invalida não é só a feature da
 * festa: lançar ou pagar uma despesa muda o estado dos cartões e o custo da meta, e quem faz isso é
 * a feature `financeiro`.
 */
export const chavesDaFesta = {
  tudo: ['festa'] as const,
  itens: ['festa', 'itens'] as const,
  meta: ['festa', 'meta'] as const,
  detalhe: (id: string) => ['festa', 'detalhe', id] as const,
}

/**
 * Os itens da festa da turma, na ordem da comissão.
 *
 * Mora em `hooks/`, e não em `features/festa`, porque três telas o consomem: a tela da festa, o
 * seletor "Item da festa" do lançamento de despesa (feature `financeiro`) e nada impede que uma
 * quarta apareça — e uma feature não importa de outra. A chamada fica aqui junto do hook, como em
 * {@link useDocumentosVigentes}.
 *
 * A primeira abertura por turma materializa os seis itens sugeridos no backend, então a resposta
 * nunca vem vazia numa turma que acabou de nascer.
 *
 * @param habilitado Falso não consulta. É o que faz a tela de Despesas só pedir a lista quando o
 *   diálogo de lançamento abre — a mesma regra do seletor de fornecedores, e o motivo de a moldura
 *   do app não ter voltado a custar uma chamada a mais por página.
 */
export function useItensDaFesta(habilitado = true) {
  return useQuery({
    queryKey: chavesDaFesta.itens,
    queryFn: ({ signal }) => api.get<ItemDaFesta[]>('/api/v1/festa/itens', { signal }),
    enabled: habilitado,
  })
}

/**
 * A meta da turma: custo da festa, arrecadado e o que falta juntar.
 *
 * Consulta própria, e não um cálculo sobre {@link useItensDaFesta}, porque o arrecadado não está na
 * lista de itens — ele vem do mesmo repositório que alimenta o Caixa, e é isso que impede a barra da
 * Página Inicial de discordar da tela do dinheiro.
 */
export function useMetaDaFesta() {
  return useQuery({
    queryKey: chavesDaFesta.meta,
    queryFn: ({ signal }) => api.get<MetaDaFesta>('/api/v1/festa/meta', { signal }),
  })
}

/**
 * Um item com as propostas levantadas para ele — o painel da direita da tela da festa.
 *
 * Consulta separada da lista de propósito: as propostas só interessam ao item aberto, e é este
 * endpoint que sabe de quem é cada voto, porque é o único que o servidor resolve contra quem está
 * lendo. Trazer tudo na lista carregaria toda abertura da tela com o que um item por vez mostra.
 *
 * @param id Item aberto. Vazio não consulta — é o estado da tela antes de a lista chegar.
 */
export function useDetalheDoItem(id: string) {
  return useQuery({
    queryKey: chavesDaFesta.detalhe(id),
    queryFn: ({ signal }) => api.get<ItemDaFestaDetalhe>(`/api/v1/festa/itens/${id}/detalhe`, { signal }),
    enabled: !!id,
  })
}
