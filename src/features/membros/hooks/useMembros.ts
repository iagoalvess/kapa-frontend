import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import type { Papel } from '@/config/perfis'
import {
  alterarPapel,
  desligarMembro,
  listarMembros,
  religarMembro,
  removerMembro,
  resumirMembros,
  resumirSaida,
} from '../api/membros.api'
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
 * @param filtro Situação, saída, papel e cadastro pendente pedidos.
 */
export function contar(
  contagens: ContagemDeMembros[],
  filtro: { ativo?: boolean; desligado?: boolean; papel?: Papel; essencialPendente?: boolean },
) {
  return contagens
    .filter(
      (c) =>
        (filtro.ativo === undefined || c.ativo === filtro.ativo) &&
        (filtro.desligado === undefined || c.desligado === filtro.desligado) &&
        (filtro.papel === undefined || c.papel === filtro.papel) &&
        (filtro.essencialPendente === undefined || c.essencial_pendente === filtro.essencialPendente),
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

/**
 * O que o desligamento de um membro vai mexer: já pago, em aberto e em atraso.
 *
 * Consulta própria, e não um campo da listagem: são somas de parcela, e carregá-las para as vinte
 * linhas da página custaria vinte agregações para a comissão desligar uma pessoa.
 *
 * @param usuarioId Membro que sairia.
 * @param habilitado Falso não consulta — o diálogo fechado não precisa dos números.
 */
export function useResumoDaSaida(usuarioId: string, habilitado: boolean) {
  return useQuery({
    queryKey: chaves.saida(usuarioId),
    queryFn: ({ signal }) => resumirSaida(usuarioId, signal),
    enabled: habilitado,
    // Os números mudam a cada baixa da tesouraria, e são a base de uma decisão irreversível.
    staleTime: 0,
  })
}

/**
 * Desligamento de um formando.
 *
 * Quem desliga **a si mesmo** perde a gestão da turma na hora: a renovação devolve um token com a
 * claim `desligado_em`, e o cache é limpo — é a mesma regra da remoção, porque o que sobra na tela
 * a partir dali é só o histórico dele.
 */
export function useDesligarMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desligarMembro,
    onSuccess: async (_, { usuario_id }) => {
      if (!ehOProprio(usuario_id)) {
        await queryClient.invalidateQueries({ queryKey: chaves.tudo })
        return
      }

      await sessao.renovar()
      queryClient.clear()
    },
  })
}

/**
 * Desfazer do desligamento.
 *
 * Não ressuscita parcela cancelada — quem religa a si mesmo volta a ver a turma, mas a cobrança
 * cancelada continua cancelada, e volta por lançamento novo.
 */
export function useReligarMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: religarMembro,
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
