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
 * Sem `usuario_id`, é o próprio (`/eu`); com ele, a correção do Presidente (`/{id}`). A resposta
 * traz o cadastro inteiro com a completude nova, então vai direto para o cache. A lista de membros
 * mostra a porcentagem nova sozinha: ela revalida sempre que monta.
 *
 * @param usuario_id Formando corrigido, quando é a comissão quem grava.
 */
export function useSalvarPerfil(usuario_id?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: AtualizarPerfil) =>
      usuario_id ? corrigirPerfil(usuario_id, dados) : atualizarMeuPerfil(dados),
    onSuccess: (perfil: PerfilDoFormando) =>
      queryClient.setQueryData(usuario_id ? chaves.detalhe(usuario_id) : chaves.meu(), perfil),
  })
}

/** Troca da própria foto. */
export function useEnviarFoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enviarFoto,
    onSuccess: (perfil) => queryClient.setQueryData(chaves.meu(), perfil),
  })
}

/**
 * A foto, pronta para o `<img>`.
 *
 * A chave é o id do arquivo, que muda a cada foto nova: a imagem de um id nunca fica velha, e o
 * próprio e a comissão compartilham o cache mesmo baixando por rotas diferentes.
 *
 * @param arquivoId Arquivo da foto; ausente não busca.
 * @param usuario_id Formando visto pela comissão; ausente é a própria foto.
 */
export function useFoto(arquivoId: string | null | undefined, usuario_id?: string) {
  return useQuery({
    queryKey: chaves.foto(arquivoId ?? ''),
    queryFn: ({ signal }) => baixarFoto(usuario_id ? { usuario_id } : { arquivoId: arquivoId! }, signal),
    enabled: Boolean(arquivoId),
    staleTime: Infinity,
  })
}

/** Endereço pelo CEP. Mutação, e não consulta: dispara quando o CEP é digitado, uma vez. */
export function useConsultarCep() {
  return useMutation({ mutationFn: (cep: string) => consultarCep(cep) })
}
