import { useMutation, useQuery } from '@tanstack/react-query'
import { env } from '@/config/env'
import {
  cadastrarGoogle,
  configuracaoGoogle,
  entrarGoogle,
  iniciarGoogle,
  solicitarVinculoGoogle,
  vincularGoogle,
} from '../api/google.api'
import { useConcluirEntrada } from './useAutenticacao'

/** Configuração e tentativa ficam sem persistência no navegador. */
export function useConfiguracaoGoogle() {
  return useQuery({
    queryKey: ['google', 'configuracao'],
    queryFn: ({ signal }) => configuracaoGoogle(signal),
    enabled: Boolean(env.VITE_GOOGLE_CLIENT_ID),
    retry: false,
  })
}
export function useTentativaGoogle(habilitado: boolean, convite?: string) {
  return useQuery({
    queryKey: ['google', 'tentativa', convite],
    queryFn: ({ signal }) => iniciarGoogle(signal, convite),
    enabled: habilitado,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
export function useEntrarGoogle() {
  const concluir = useConcluirEntrada()
  return useMutation({
    mutationFn: entrarGoogle,
    onSuccess: (resposta) => {
      if ('access_token' in resposta) return concluir(resposta)
    },
  })
}
export function useCadastrarGoogle() {
  const concluir = useConcluirEntrada()
  return useMutation({ mutationFn: cadastrarGoogle, onSuccess: concluir })
}
export function useSolicitarVinculoGoogle() {
  return useMutation({ mutationFn: solicitarVinculoGoogle })
}
export function useVincularGoogle() {
  const concluir = useConcluirEntrada()
  return useMutation({ mutationFn: vincularGoogle, onSuccess: concluir })
}
