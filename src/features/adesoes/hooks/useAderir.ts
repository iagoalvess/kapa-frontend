import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { baixarArquivo } from '@/lib/download'
import { aderir, baixarPdf, obterMinhaAdesao, solicitarCodigo } from '../api/adesoes.api'
import { chaves } from './chaves'
import { useSituacaoDaAdesao } from './useAdesaoObrigatoria'

/**
 * A própria adesão mais recente e o que falta no cadastro para aderir.
 *
 * @param habilitado Falso sem turma na sessão.
 */
export function useMinhaAdesao(habilitado = true) {
  return useQuery({
    queryKey: chaves.minha(),
    queryFn: ({ signal }) => obterMinhaAdesao(signal),
    enabled: habilitado,
  })
}

/**
 * Se há termo e plano para aceitar e a pessoa ainda não aderiu — o ponto no item "Termo" do menu e o aviso do
 * Início.
 *
 * Só com a turma ativa: é quando o aceite grava. Quem aderiu a uma versão anterior não conta como
 * pendente — continua na versão dele até a comissão pedir.
 *
 * Lê a situação leve (`/adesoes/eu/situacao`), a mesma da guarda de adesão: este ponto está na barra
 * lateral de toda tela, e o termo vigente vem com o texto inteiro e o plano simulado.
 *
 * @param habilitado Falso não consulta — quem foi desligado não adere a nada, e a API responderia 403
 *   (P5 da Sprint 15).
 */
export function useAdesaoPendente(habilitado = true) {
  const formatura = useFormaturaAtual()
  const { data: situacao } = useSituacaoDaAdesao(habilitado)

  return (
    formatura.data?.status === 'Ativa' &&
    situacao !== undefined &&
    situacao.termo_publicado &&
    situacao.plano_vigente &&
    !situacao.aderiu
  )
}

/**
 * O código do aceite, enviado ao e-mail da conta.
 *
 * Nada a invalidar: o código não muda dado nenhum da tela, só chega na caixa de entrada. O que a
 * resposta traz — o e-mail mascarado — é do momento, e vive no estado do formulário.
 */
export function useSolicitarCodigo() {
  return useMutation({ mutationFn: solicitarCodigo })
}

/**
 * O aceite. A resposta é a adesão; o resto da feature recarrega.
 *
 * O aceite também gera as parcelas da tesouraria (`cobrancas`) e do extrato pessoal (`pagamentos`).
 * Ambos os caches precisam mudar para não manter "nenhuma parcela" depois do aceite.
 */
export function useAderir() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: aderir,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      void queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    },
  })
}

/** Baixa o termo assinado e entrega ao navegador como arquivo. */
export function useBaixarPdf() {
  return useMutation({
    mutationFn: async ({ adesao_id, versao }: { adesao_id: string; versao: number }) =>
      baixarArquivo(await baixarPdf(adesao_id), `termo-de-adesao-v${versao}.pdf`),
  })
}
