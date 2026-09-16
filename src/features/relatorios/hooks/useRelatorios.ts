import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { baixarArquivo } from '@/lib/download'
import { mensagemDoErro } from '@/lib/http/erros'
import {
  baixarSolicitacao,
  exportar,
  listarSolicitacoes,
  obterBalancete,
  obterOpcoesDeFiltro,
  solicitarRelatorio,
} from '../api/relatorios.api'
import {
  type FiltroDoRelatorio,
  type PeriodoDoRelatorio,
  ROTULOS_DE_RELATORIO,
  type Solicitacao,
  type TipoDeRelatorio,
} from '../types/relatorios.types'
import { chaves } from './chaves'

/** De quanto em quanto tempo a fila é reconsultada enquanto houver um PDF gerando. */
const INTERVALO_DA_FILA = 5_000

/** O balancete do período — o que a tela desenha antes de exportar. */
export function useBalancete(periodo: PeriodoDoRelatorio) {
  return useQuery({
    queryKey: chaves.balancete(periodo),
    queryFn: ({ signal }) => obterBalancete(periodo, signal),
  })
}

/**
 * O que os seletores de filtro oferecem.
 *
 * Muda pouco — fornecedor novo, formando novo — e é lida a cada abertura do painel, então fica meia
 * hora fresca em vez de ir ao servidor a cada clique no botão "Filtros".
 */
export function useOpcoesDeFiltro() {
  return useQuery({
    queryKey: chaves.opcoesDeFiltro,
    queryFn: ({ signal }) => obterOpcoesDeFiltro(signal),
    staleTime: 30 * 60_000,
  })
}

/**
 * A fila de PDFs, com o status de cada pedido.
 *
 * Repete a consulta enquanto houver algo na fila, e para quando não houver: o worker leva alguns
 * segundos, e a alternativa seria o usuário atualizar a página para descobrir que ficou pronto.
 */
export function useSolicitacoes() {
  return useQuery({
    queryKey: chaves.solicitacoes,
    queryFn: ({ signal }) => listarSolicitacoes(signal),
    refetchInterval: ({ state }) =>
      state.data?.some((solicitacao) => solicitacao.status === 'NaFila') ? INTERVALO_DA_FILA : false,
  })
}

/**
 * O que o aviso diz enquanto o worker trabalha.
 *
 * Já foi um contador de segundos ("Há 12s"), que na prática ficava **sempre** em "Há 0s": o React
 * Query faz `structuralSharing`, então uma consulta que devolve exatamente o mesmo JSON mantém a
 * mesma referência de `data` — o efeito não roda de novo, a tela não redesenha, e o texto congela no
 * valor calculado quando o pedido entrou na lista, que é zero. Fazê-lo andar pediria um relógio
 * próprio redesenhando a tela de segundo em segundo, para um número que ninguém usa.
 *
 * No lugar dele, o que o usuário de fato não sabia: o arquivo baixa sozinho. Quem mostra que há algo
 * em andamento é a barra do aviso.
 */
const EM_ANDAMENTO = 'O download começa sozinho.'

/**
 * O relatório no meio da frase — "balancete do período em PDF".
 *
 * O rótulo desce para minúsculas, a sigla não: `'Balancete do período em PDF'.toLowerCase()` também
 * come o "PDF", e o aviso nascia "em PDF…" e virava "em pdf…" na primeira consulta da fila.
 *
 * @param tipo Qual relatório.
 */
const emPdf = (tipo: TipoDeRelatorio) => `${ROTULOS_DE_RELATORIO[tipo].toLowerCase()} em PDF`

/**
 * Pede o PDF e acompanha a geração no próprio toast.
 *
 * O toast é o único lugar que fala da fila — não há mais um card de histórico na tela. Ele nasce com
 * a barra correndo e, no fim, o arquivo baixa sozinho — ou o toast vira vermelho com o motivo. Um
 * toast por pedido, preso ao id da solicitação.
 *
 * **Só fala do que este navegador pediu.** Ao montar, adota o que ainda está na fila — quem
 * recarregou a página no meio da geração volta a ver o progresso —, mas não anuncia PDF antigo que
 * já estava pronto: aviso que aparece sozinho na abertura da tela é ruído.
 *
 * @param filtro O recorte em vigor. Vai **gravado** no pedido: quem monta o arquivo é o worker,
 *   minutos depois, e o que não for enviado aqui não existe para ele.
 */
export function useSolicitarRelatorio(filtro: FiltroDoRelatorio) {
  const queryClient = useQueryClient()
  const fila = useSolicitacoes()
  const baixar = useBaixarRelatorio()
  const esperando = useRef(new Set<string>())

  const solicitacoes = fila.data

  useEffect(() => {
    if (!solicitacoes) return

    for (const solicitacao of solicitacoes) {
      if (solicitacao.status === 'NaFila') esperando.current.add(solicitacao.id)

      if (!esperando.current.has(solicitacao.id)) continue

      if (solicitacao.status === 'NaFila') {
        toast.loading(`Gerando o ${emPdf(solicitacao.tipo)}…`, {
          id: solicitacao.id,
          description: EM_ANDAMENTO,
        })

        continue
      }

      esperando.current.delete(solicitacao.id)

      if (solicitacao.status === 'Pronta') {
        // Baixa sozinho: quem pediu o relatório quer o arquivo, e o `esperando` acima garante que
        // isto roda uma vez por pedido — reabrir a tela não rebaixa o que já veio.
        baixar.mutate(solicitacao)
        toast.success(`${ROTULOS_DE_RELATORIO[solicitacao.tipo]} em PDF pronto.`, { id: solicitacao.id })
      } else
        toast.error(`Não deu para gerar o ${emPdf(solicitacao.tipo)}.`, {
          id: solicitacao.id,
          description: solicitacao.motivo,
        })
    }
  }, [solicitacoes, baixar])

  return useMutation({
    mutationFn: (tipo: TipoDeRelatorio) => solicitarRelatorio({ tipo, filtro }),
    onSuccess: (solicitacao, tipo) => {
      esperando.current.add(solicitacao.id)
      // `void`: devolver a promessa da invalidação seguraria o toast até a fila voltar.
      void queryClient.invalidateQueries({ queryKey: chaves.solicitacoes })

      toast.loading(`Gerando o ${emPdf(tipo)}…`, {
        id: solicitacao.id,
        description: EM_ANDAMENTO,
      })
    },
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}

/** Baixa o PDF de uma solicitação pronta. */
export function useBaixarRelatorio() {
  return useMutation({
    mutationFn: async (solicitacao: Solicitacao) =>
      baixarArquivo(
        await baixarSolicitacao(solicitacao.id),
        `${solicitacao.tipo.toLowerCase()}-${solicitacao.de}-a-${solicitacao.ate}.pdf`,
      ),
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}

/**
 * Baixa a planilha do recorte, na hora.
 *
 * O nome do arquivo é montado aqui, e não lido do `Content-Disposition`: o cliente HTTP devolve só
 * os bytes, e os dois lados já conhecem o período. O recorte não entra no nome — quem o diz é o
 * subtítulo dentro da planilha, e um nome com seis filtros não caberia na pasta de Downloads.
 */
export function useExportar(filtro: FiltroDoRelatorio) {
  return useMutation({
    mutationFn: async (tipo: TipoDeRelatorio) => {
      const arquivo = await exportar(tipo, filtro)

      baixarArquivo(arquivo, `${tipo.toLowerCase()}-${filtro.de ?? 'inicio'}-a-${filtro.ate ?? 'hoje'}.xlsx`)
    },
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}
