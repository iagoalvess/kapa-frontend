import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { baixarArquivo } from '@/lib/download'
import { aderir, baixarPdf, obterMinhaAdesao, solicitarCodigo } from '../api/adesoes.api'
import { chaves } from './chaves'
import { useConteudoParaAdesao } from './useTermo'

/** A própria adesão mais recente e o que falta no cadastro para aderir. */
export function useMinhaAdesao() {
  return useQuery({ queryKey: chaves.minha(), queryFn: ({ signal }) => obterMinhaAdesao(signal) })
}

/**
 * Se há termo e plano para aceitar e a pessoa ainda não aderiu — o ponto no item "Termo" do menu.
 *
 * Só com a turma ativa: é quando o aceite grava. Quem aderiu a uma versão anterior não conta como
 * pendente — continua na versão dele até a comissão pedir.
 *
 * O termo vigente só é consultado por quem ainda não aderiu. Ele vem com o texto inteiro e o plano
 * simulado (uns 5 KB), e este ponto está na barra lateral de toda tela: para quem já assinou — que
 * é quase todo mundo, quase sempre — a resposta já está decidida sem ele.
 *
 * @param habilitado Falso não consulta o termo vigente — quem foi desligado não adere a nada, e a
 *   API responderia 403 (P5 da Sprint 15).
 */
export function useAdesaoPendente(habilitado = true) {
  const formatura = useFormaturaAtual()
  const minha = useMinhaAdesao()
  const conteudo = useConteudoParaAdesao(
    habilitado && formatura.data?.status === 'Ativa' && minha.data !== undefined && !minha.data.adesao,
  )

  return (
    formatura.data?.status === 'Ativa' &&
    Boolean(conteudo.data?.hash_do_conteudo) &&
    minha.data !== undefined &&
    !minha.data.adesao
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
 * O aceite também gera as parcelas, que vivem no cache de `cobrancas`: derrubar pelo prefixo é o
 * único contato com a outra feature — sem importar nada dela.
 */
export function useAderir() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: aderir,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
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
