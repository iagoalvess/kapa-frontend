import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { FormaturaDetalhe, StatusDaFormatura } from '@/types/formatura'
import { useFormaturaAtiva } from './useSessao'

/** Prefixo da chave de {@link useFormaturaAtual}: quem muda o status (a assinatura) invalida por ele. */
export const CHAVE_DA_FORMATURA_ATUAL = ['formaturas', 'atual'] as const

/**
 * A formatura selecionada, com o status.
 *
 * Mora em `hooks/`, e não em `features/formaturas`, porque toda feature com botão de escrita
 * precisa do status para desabilitá-lo — e uma feature não importa de outra. A chamada fica aqui
 * junto do hook pelo mesmo motivo de `useDocumentosVigentes`: é a única dele.
 *
 * O id da formatura entra na chave: trocar de turma nunca reaproveita o status da anterior.
 */
export function useFormaturaAtual() {
  const { formaturaId } = useFormaturaAtiva()

  return useQuery({
    queryKey: [...CHAVE_DA_FORMATURA_ATUAL, formaturaId],
    queryFn: ({ signal }) => api.get<FormaturaDetalhe>('/api/v1/formaturas/atual', { signal }),
    enabled: formaturaId !== null,
  })
}

/**
 * Status em que cada tipo de escrita passa — espelha as políticas `ExigeFormatura*` da API.
 *
 * - `ativa`: o dia a dia da turma, e nunca em modo leitura.
 * - `aberta`: o cadastro da própria pessoa. Encerrada e descartada são arquivo.
 *
 * `editavel` sumiu em 18/09/2026 junto com `Rascunho`: montar a comissão passou a pedir turma
 * ativa, como todo o resto, porque toda turma nasce ativa no gratuito.
 */
const STATUS_QUE_ESCREVEM = {
  ativa: ['Ativa'],
  aberta: ['Ativa', 'Suspensa'],
} as const satisfies Record<string, readonly StatusDaFormatura[]>

/**
 * Se a formatura aceita este tipo de escrita.
 *
 * É conveniência de tela, não segurança: a API recusa com `formatura.inativa` de qualquer forma.
 * Enquanto o status carrega, libera — piscar os botões desabilitados para a turma ativa, que é
 * quase todo mundo, custa mais do que um 403 raro.
 *
 * @param escrita Tipo de escrita, como em {@link STATUS_QUE_ESCREVEM}. O padrão é o dia a dia.
 */
export function useEscritaLiberada(escrita: keyof typeof STATUS_QUE_ESCREVEM = 'ativa') {
  const { data } = useFormaturaAtual()
  const aceitos: readonly StatusDaFormatura[] = STATUS_QUE_ESCREVEM[escrita]

  return data === undefined || aceitos.includes(data.status)
}
