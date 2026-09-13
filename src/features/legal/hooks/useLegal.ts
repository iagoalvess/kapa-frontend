import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TipoDeDocumento } from '@/config/legal'
import { useDocumentosVigentes } from '@/hooks/useDocumentosVigentes'
import { useSessao } from '@/hooks/useSessao'
import { obterMeusAceites, obterVersao, registrarAceites } from '../api/legal.api'
import { chaves } from './chaves'

/**
 * Um documento para leitura: a versão pedida na URL, ou a vigente quando não há versão.
 *
 * @param tipo Documento.
 * @param versao Versão do link permanente, se houver.
 */
export function useDocumento(tipo: TipoDeDocumento, versao: string | undefined) {
  const vigentes = useDocumentosVigentes()
  const especifica = useQuery({
    queryKey: chaves.versao(tipo, versao ?? ''),
    queryFn: ({ signal }) => obterVersao(tipo, versao ?? '', signal),
    enabled: versao !== undefined,
    staleTime: Infinity,
  })

  const consulta = versao === undefined ? vigentes : especifica
  const documento = versao === undefined ? vigentes.data?.find((d) => d.tipo === tipo) : especifica.data

  return { documento, carregando: consulta.isPending, erro: consulta.error }
}

/** Histórico e pendências de aceite de quem está logado. */
export function useMeusAceites() {
  const { usuario } = useSessao()

  return useQuery({
    queryKey: chaves.meusAceites(usuario?.id ?? ''),
    queryFn: ({ signal }) => obterMeusAceites(signal),
    enabled: usuario !== null,
  })
}

/**
 * Aceite das versões vigentes.
 *
 * Espera a pendência ser relida antes de terminar: a guarda de rota decide pelo cache, e sair
 * da tela com o cache velho a mandaria de volta para o re-aceite. Relê também na falha — um 409
 * de versão desatualizada significa que as pendências mudaram.
 */
export function useRegistrarAceites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registrarAceites,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...chaves.tudo, 'meus-aceites'] }),
  })
}
