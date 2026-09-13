import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarMeuPerfil,
  baixarFoto,
  consultarCep,
  corrigirPerfil,
  enviarFoto,
  obterMeuPerfil,
} from '../api/formandos.api'
import type { AtualizarPerfil, PerfilDoFormando } from '../types/formandos.types'
import { chaves } from './chaves'

/** O próprio cadastro na formatura selecionada. */
export function useMeuPerfil() {
  return useQuery({ queryKey: chaves.meu(), queryFn: ({ signal }) => obterMeuPerfil(signal) })
}

/**
 * Gravação de uma seção do cadastro.
 *
 * Sem `usuarioId`, é o próprio (`/eu`); com ele, a correção do Presidente (`/{id}`). A resposta
 * traz o cadastro inteiro com a completude nova, então vai direto para o cache — e a lista da
 * comissão recarrega, porque a porcentagem mudou.
 *
 * @param usuarioId Formando corrigido, quando é a comissão quem grava.
 */
export function useSalvarPerfil(usuarioId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: AtualizarPerfil) =>
      usuarioId ? corrigirPerfil(usuarioId, dados) : atualizarMeuPerfil(dados),
    onSuccess: (perfil: PerfilDoFormando) => {
      queryClient.setQueryData(usuarioId ? chaves.detalhe(usuarioId) : chaves.meu(), perfil)
      void queryClient.invalidateQueries({ queryKey: chaves.listas })
    },
  })
}

/** Troca da própria foto. */
export function useEnviarFoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enviarFoto,
    onSuccess: (perfil) => {
      queryClient.setQueryData(chaves.meu(), perfil)
      void queryClient.invalidateQueries({ queryKey: chaves.listas })
    },
  })
}

/**
 * A foto, pronta para o `<img>`.
 *
 * A chave é o id do arquivo, que muda a cada foto nova: a imagem de um id nunca fica velha, e o
 * próprio e a comissão compartilham o cache mesmo baixando por rotas diferentes.
 *
 * @param arquivoId Arquivo da foto; ausente não busca.
 * @param usuarioId Formando visto pela comissão; ausente é a própria foto.
 */
export function useFoto(arquivoId: string | undefined, usuarioId?: string) {
  return useQuery({
    queryKey: chaves.foto(arquivoId ?? ''),
    queryFn: ({ signal }) => baixarFoto(usuarioId ? { usuarioId } : { arquivoId: arquivoId! }, signal),
    enabled: arquivoId !== undefined,
    staleTime: Infinity,
  })
}

/** Endereço pelo CEP. Mutação, e não consulta: dispara quando o CEP é digitado, uma vez. */
export function useConsultarCep() {
  return useMutation({ mutationFn: (cep: string) => consultarCep(cep) })
}
