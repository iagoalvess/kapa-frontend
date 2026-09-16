import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarTermos, obterConteudoParaAdesao, publicarTermo } from '../api/adesoes.api'
import { chaves } from './chaves'

/**
 * O termo vigente, o plano vigente e o hash dos dois.
 *
 * Sem `staleTime`: o hash precisa ser o do conteúdo que está na tela agora, e o conteúdo muda
 * quando a comissão publica ou a tesouraria mexe no plano.
 */
export function useConteudoParaAdesao() {
  return useQuery({
    queryKey: chaves.conteudo(),
    queryFn: ({ signal }) => obterConteudoParaAdesao(signal),
    staleTime: 0,
  })
}

/**
 * As versões publicadas, com quantos aceitaram cada uma.
 *
 * @param habilitado Só o Presidente lê; para os demais a API responderia 403.
 */
export function useTermos(habilitado: boolean) {
  return useQuery({
    queryKey: chaves.termos(),
    queryFn: ({ signal }) => listarTermos(signal),
    enabled: habilitado,
  })
}

/**
 * Publicar muda o conteúdo vigente, a lista de versões e quem "aderiu à vigente" no painel.
 *
 * A invalidação vai com `void`, sem devolver a promessa: devolvida, o React Query esperaria a
 * releitura antes do `onSuccess` de quem chamou — e a releitura troca a versão vigente, remonta o
 * editor, e o toast e o fechamento do editor se perdem com a instância desmontada.
 */
export function usePublicarTermo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publicarTermo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
    },
  })
}
