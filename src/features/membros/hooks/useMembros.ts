import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import type { Papel } from '@/config/perfis'
import { alterarPapel, listarMembros, removerMembro, resumirMembros } from '../api/membros.api'
import type { ContagemDeMembros, FiltroDeMembros } from '../types/membros.types'
import { chaves } from './chaves'

/**
 * Uma página dos membros da formatura selecionada.
 *
 * Sempre revalida ao montar: a completude muda em outra tela (o cadastro do membro, o próprio
 * cadastro), e quem volta de lá tem de ver a porcentagem nova sem que aquela feature precise
 * conhecer as chaves desta.
 */
export function useMembros(filtro: FiltroDeMembros) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => listarMembros(filtro, signal),
    staleTime: 0,
    // Mantém a página anterior na tela enquanto a próxima chega, em vez de piscar "Carregando".
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Quantos membros ativos ainda não preencheram o essencial — o número da faixa.
 *
 * Uma página de um item só: a pergunta é o `total`.
 */
export function usePendentesDeCadastro() {
  const filtro: FiltroDeMembros = { ativo: true, cadastro: 'Pendente', tamanho: 1 }

  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => listarMembros(filtro, signal),
    staleTime: 0,
    select: (pagina) => pagina.total,
  })
}

/**
 * Contagem de membros por papel e situação — os números da faixa e dos filtros.
 *
 * Mora sob `chaves.tudo`: trocar papel ou remover alguém invalida a lista e o resumo juntos.
 *
 * @param habilitado Falso não consulta — para telas que todo membro abre, onde só a Gestão lê o
 *   resumo (a API responderia 403 ao formando).
 */
export function useResumoDeMembros(habilitado = true) {
  return useQuery({
    queryKey: chaves.resumo(),
    queryFn: ({ signal }) => resumirMembros(signal),
    enabled: habilitado,
  })
}

/**
 * Soma as contagens que atendem ao filtro. Campo ausente no filtro não restringe.
 *
 * @param contagens Resposta de `GET /membros/resumo`.
 * @param filtro Situação e papel pedidos.
 */
export function contar(contagens: ContagemDeMembros[], filtro: { ativo?: boolean; papel?: Papel }) {
  return contagens
    .filter(
      (c) =>
        (filtro.ativo === undefined || c.ativo === filtro.ativo) &&
        (filtro.papel === undefined || c.papel === filtro.papel),
    )
    .reduce((total, c) => total + c.quantidade, 0)
}

/** Diz se o membro alterado é quem está logado. */
const ehOProprio = (usuario_id: string) => usuario_id === sessao.estado().usuario?.id

/**
 * Troca de papel de um membro.
 *
 * Quem troca o **próprio** papel tem a sessão renovada: a API já decide pelo vínculo gravado, mas
 * a tela decide pela claim `papel` do token, e sem renovar o ex-presidente continuaria vendo os
 * controles até o token vencer.
 */
export function useAlterarPapel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: alterarPapel,
    onSuccess: async (_, { usuario_id }) => {
      if (ehOProprio(usuario_id)) await sessao.renovar()
      await queryClient.invalidateQueries({ queryKey: chaves.tudo })
    },
  })
}

/**
 * Remoção (desativação) de um membro.
 *
 * Quem remove **a si mesmo** sai da turma: a renovação devolve um token sem a formatura, e o
 * cache inteiro é limpo — é a mesma regra da troca de formatura, senão os dados da turma
 * ficariam na memória da aba.
 */
export function useRemoverMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removerMembro,
    onSuccess: async (_, usuario_id) => {
      if (!ehOProprio(usuario_id)) {
        await queryClient.invalidateQueries({ queryKey: chaves.tudo })
        return
      }

      await sessao.renovar()
      queryClient.clear()
    },
  })
}
