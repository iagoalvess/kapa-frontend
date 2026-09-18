import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { baixarArquivo } from '@/lib/download'
import { mensagemDoErro } from '@/lib/http/erros'
import {
  baixarPacote,
  cancelarSolicitacao,
  confirmarSolicitacao,
  listarOperadores,
  listarSolicitacoes,
  obterMeusDados,
  revogarConsentimento,
  solicitar,
} from '../api/privacidade.api'
import type { SolicitacaoDePrivacidade, TipoDeSolicitacao } from '../types/privacidade.types'
import { chaves } from './chaves'

/** O que o botão manda: o tipo e, só na eliminação, a senha da conta. */
export interface PedidoDePrivacidade {
  tipo: TipoDeSolicitacao
  senha?: string
}

/** De quanto em quanto tempo a fila é reconsultada enquanto houver pedido em andamento. */
const INTERVALO_DA_FILA = 5_000

/** Tudo o que a Kapa guarda sobre você — o direito de confirmação e acesso, numa consulta. */
export function useMeusDados() {
  return useQuery({
    queryKey: chaves.meusDados,
    queryFn: ({ signal }) => obterMeusDados(signal),
  })
}

/**
 * Os pedidos do titular.
 *
 * Repete enquanto houver pedido pendente, e para quando não houver. A exportação fica pronta em
 * segundos; a eliminação fica pendente por quinze dias, e nesse caso a repetição é inofensiva — quem
 * está com a tela aberta por quinze dias tem problemas maiores.
 */
export function useSolicitacoes() {
  return useQuery({
    queryKey: chaves.solicitacoes,
    queryFn: ({ signal }) => listarSolicitacoes(signal),
    refetchInterval: ({ state }) =>
      state.data?.some(
        (solicitacao) => solicitacao.tipo === 'Exportacao' && solicitacao.status === 'Pendente',
      )
        ? INTERVALO_DA_FILA
        : false,
  })
}

/** Com quem a Kapa compartilha dado pessoal. Anônimo, e muda quando se troca de fornecedor. */
export function useOperadores() {
  return useQuery({
    queryKey: chaves.operadores,
    queryFn: ({ signal }) => listarOperadores(signal),
    staleTime: 60 * 60_000,
  })
}

/**
 * Abre um pedido de exportação ou de eliminação.
 *
 * O aviso muda com o tipo porque as duas coisas não se parecem: uma é um download que chega em
 * segundos, a outra é irreversível e tem prazo. Dizer "pedido registrado" para as duas seria
 * anunciar a segunda como se fosse a primeira.
 */
export function useSolicitar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tipo, senha }: PedidoDePrivacidade) => solicitar(tipo, senha),
    onSuccess: (_, { tipo }) => {
      // `void`: devolver a promessa da invalidação seguraria o toast até a fila voltar.
      void queryClient.invalidateQueries({ queryKey: chaves.solicitacoes })

      if (tipo === 'Exportacao')
        toast.success('Estamos preparando seu pacote.', {
          description: 'Você recebe um e-mail quando ele ficar pronto, e ele aparece aqui.',
        })
      else
        toast.success('Pedido de eliminação registrado.', {
          description: 'Você tem 15 dias para desistir. Enviamos um e-mail com os detalhes.',
        })
    },
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}

/** Confirma a eliminação e dispensa a espera dos quinze dias. */
export function useConfirmarSolicitacao() {
  return useMutacaoDaFila(confirmarSolicitacao, 'Confirmado. Seus dados serão eliminados em instantes.')
}

/** Desiste de um pedido ainda pendente. */
export function useCancelarSolicitacao() {
  return useMutacaoDaFila(cancelarSolicitacao, 'Pedido cancelado.')
}

/** Baixa o pacote de uma exportação pronta. */
export function useBaixarPacote() {
  return useMutation({
    mutationFn: async (solicitacao: SolicitacaoDePrivacidade) =>
      baixarArquivo(
        await baixarPacote(solicitacao.id),
        `meus-dados-kapa-${solicitacao.concluida_em?.slice(0, 10) ?? 'exportacao'}.zip`,
      ),
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}

/**
 * Revoga um consentimento.
 *
 * Invalida `meusDados` porque o histórico mora lá: sem isso a linha revogada só apareceria no
 * próximo F5, e quem clicou acha que não funcionou. Não invalida a sessão nem força navegação — se a
 * revogação criar uma pendência de aceite, quem trata é a guarda, na próxima rota protegida.
 */
export function useRevogarConsentimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => revogarConsentimento(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.meusDados })

      toast.success('Consentimento revogado.', {
        description: 'Se este documento for obrigatório, vamos pedir o aceite de novo na próxima entrada.',
      })
    },
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}

/**
 * As duas transições da fila, que só diferem na chamada e no texto.
 *
 * @param acao A chamada da API.
 * @param mensagem O que o toast diz no sucesso.
 */
function useMutacaoDaFila(acao: (id: string) => Promise<unknown>, mensagem: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => acao(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.solicitacoes })

      toast.success(mensagem)
    },
    onError: (erro) => toast.error(mensagemDoErro(erro)),
  })
}
