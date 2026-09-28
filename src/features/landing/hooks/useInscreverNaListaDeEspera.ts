import { useMutation } from '@tanstack/react-query'
import { inscreverNaListaDeEspera } from '../api/listaDeEspera.api'

/** Envia a inscrição na lista de espera. Sem cache a invalidar: o site não lê a lista. */
export function useInscreverNaListaDeEspera() {
  return useMutation({ mutationFn: inscreverNaListaDeEspera })
}
