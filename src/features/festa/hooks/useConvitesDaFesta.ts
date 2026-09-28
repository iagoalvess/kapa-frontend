import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import { baixarArquivo } from '@/lib/download'
import {
  baixarConviteEmPdf,
  baixarListaDaPortaria,
  buscarConvitePublico,
  buscarMeusConvites,
  buscarPortaria,
  consultarNaPortaria,
  desfazerEntrada,
  emitirCortesia,
  emitirPendentes,
  liberarConvites,
  nomearConvidado,
  reemitirConvite,
  sincronizarEntradas,
  validarEntrada,
} from '../api/convites.api'
import type { TipoDoEventoDoConvite } from '../types/convites.types'

/** Os convites do próprio formando para um evento: a festa, ou a colação. */
export function useMeusConvites(tipo: TipoDoEventoDoConvite) {
  return useQuery({
    queryKey: chavesDosConvites.meus(tipo),
    queryFn: ({ signal }) => buscarMeusConvites(tipo, signal),
  })
}

/**
 * O convite como o convidado o vê, sem sessão.
 *
 * Sem nova tentativa em 404: código inexistente não passa a existir, e cada tentativa gasta a cota
 * de quem está no Wi-Fi da festa.
 */
export function useConvitePublico(token: string) {
  return useQuery({
    queryKey: chavesDosConvites.publico(token),
    queryFn: ({ signal }) => buscarConvitePublico(token, signal),
    retry: false,
  })
}

/**
 * O convite como a portaria o vê — só para a Gestão logada.
 *
 * 404 aqui é "não é desta turma" (decisão 15): a página mostra o convite e esconde a validação.
 *
 * @param codigo Código ou token.
 * @param habilitado Falso não consulta: o convidado e o formando não têm acesso.
 */
export function useConsultaNaPortaria(codigo: string, habilitado: boolean) {
  return useQuery({
    queryKey: chavesDosConvites.consulta(codigo),
    queryFn: ({ signal }) => consultarNaPortaria(codigo, signal),
    enabled: habilitado && codigo.length > 0,
    retry: false,
  })
}

/**
 * A lista da portaria de um evento.
 *
 * Os dados anteriores ficam na tela enquanto a busca nova chega — e ficam também quando a rede cai:
 * é a lista que a portaria degrada para usar sem sinal (decisão 7). Só os do mesmo evento: trocar
 * da festa para a colação com a lista da festa na tela validaria entrada no evento errado.
 */
export function usePortaria(tipo: TipoDoEventoDoConvite, busca: string) {
  return useQuery({
    queryKey: chavesDosConvites.portaria(tipo, busca),
    queryFn: ({ signal }) => buscarPortaria(tipo, busca || undefined, signal),
    placeholderData: (anterior) => (anterior?.evento.tipo === tipo ? anterior : undefined),
    refetchInterval: 30_000,
  })
}

/** Toda escrita de convite derruba as leituras de convite: a lista, os meus, a consulta e o resumo. */
function useEscritaDeConvite<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}

/** Nomeia ou troca o convidado. */
export function useNomearConvidado() {
  return useEscritaDeConvite(nomearConvidado)
}

/** Revoga o código e emite outro. */
export function useReemitirConvite() {
  return useEscritaDeConvite(reemitirConvite)
}

/** Convite da turma, sem dono. */
export function useEmitirCortesia() {
  return useEscritaDeConvite(emitirCortesia)
}

/** Convites de um pedido antes da quitação. */
export function useLiberarConvites() {
  return useEscritaDeConvite(liberarConvites)
}

/** Convites dos pedidos quitados que esperavam a agenda. */
export function useEmitirPendentes() {
  return useEscritaDeConvite(emitirPendentes)
}

/** Valida a entrada. */
export function useValidarEntrada() {
  return useEscritaDeConvite(validarEntrada)
}

/** Desfaz uma entrada. */
export function useDesfazerEntrada() {
  return useEscritaDeConvite(desfazerEntrada)
}

/** Sobe as entradas marcadas sem rede. */
export function useSincronizarEntradas() {
  return useEscritaDeConvite(sincronizarEntradas)
}

/** Baixa o PDF de um convite, com o código no nome do arquivo. */
export function useBaixarConvite() {
  return useMutation({
    mutationFn: async ({ token, codigo }: { token: string; codigo: string }) =>
      baixarArquivo(await baixarConviteEmPdf(token), `convite-${codigo}.pdf`),
  })
}

/** Baixa a lista da portaria do evento em PDF. */
export function useBaixarListaDaPortaria() {
  return useMutation({
    mutationFn: async (tipo: TipoDoEventoDoConvite) =>
      baixarArquivo(await baixarListaDaPortaria(tipo), 'lista-da-portaria.pdf'),
  })
}
