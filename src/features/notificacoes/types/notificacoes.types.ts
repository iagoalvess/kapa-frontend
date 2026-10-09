import type { PaginacaoRequest } from '@/types/paginacao'

/** O que faz um degrau da régua disparar. Espelha `GatilhoDaRegua` do backend. */
type GatilhoDaRegua = 'Vencimento' | 'InformePendente'

/** O desfecho de um envio. Espelha `StatusDaNotificacao`. */
export type StatusDaNotificacao = 'Enfileirada' | 'Entregue' | 'Falhou'

/** Como cada resultado aparece no histórico. */
export const ROTULOS_DE_STATUS = {
  Enfileirada: 'Na fila',
  Entregue: 'Entregue',
  Falhou: 'Falhou',
} as const satisfies Record<StatusDaNotificacao, string>

/** Um degrau da régua. Texto e destinatários são do Kapa; a turma só liga ou desliga. */
export interface Regra {
  id: string
  gatilho: GatilhoDaRegua
  /** Dias de distância do gatilho; negativo é antes do vencimento. */
  dias_de_deslocamento: number
  assunto: string
  ativa: boolean
  avisar_tesouraria: boolean
}

/** A régua da turma. */
export interface Regua {
  regras: Regra[]
}

/** Uma linha do histórico de envios. */
export interface Notificacao {
  id: string
  destinatario: string
  /** Nulo no resumo à tesouraria, que não tem vínculo. */
  nome: string | null
  assunto: string
  status: StatusDaNotificacao
  /** Nulo enquanto não falhou. */
  erro: string | null
  data_de_referencia: string
  enviada_em: string
  gatilho: GatilhoDaRegua
  dias_de_deslocamento: number
}

/** Filtros do histórico. */
export interface FiltroDeNotificacoes extends PaginacaoRequest {
  status?: StatusDaNotificacao
  /** Dia de referência (quando a régua rodou), de/até inclusive — `aaaa-mm-dd`. */
  de?: string
  ate?: string
  busca?: string
}

/**
 * Quando o lembrete é enviado, em palavras para aparecer na tela e no histórico.
 *
 * @param regra Degrau.
 */
export function marcoDoDegrau(regra: Pick<Regra, 'gatilho' | 'dias_de_deslocamento'>) {
  const dias = regra.dias_de_deslocamento
  if (regra.gatilho === 'InformePendente')
    return `${dias} ${dias === 1 ? 'dia' : 'dias'} após o aviso de pagamento`
  if (dias === 0) return 'No vencimento'
  if (dias < 0) return `${Math.abs(dias)} ${dias === -1 ? 'dia' : 'dias'} antes do vencimento`
  return `${dias} ${dias === 1 ? 'dia' : 'dias'} após o vencimento`
}

/**
 * O que o degrau significa, em palavras — o rótulo embaixo do ponto e o título do editor.
 *
 * @param regra Degrau.
 */
export function tomDoDegrau(regra: Pick<Regra, 'gatilho' | 'dias_de_deslocamento'>) {
  const dias = regra.dias_de_deslocamento

  if (regra.gatilho === 'InformePendente') return 'Pagamento aguardando conferência'
  if (dias < 0) return 'Lembrete'
  if (dias === 0) return 'Vence hoje'
  if (dias <= 7) return 'Em atraso'
  if (dias <= 20) return 'Multa e juros'
  return 'Cobrança firme'
}

/** Quem recebe o degrau: o formando, ou a tesouraria. */
export function destinoDoDegrau(regra: Pick<Regra, 'gatilho' | 'avisar_tesouraria'>) {
  if (regra.gatilho === 'InformePendente') return 'Tesouraria'
  return regra.avisar_tesouraria ? 'Formando e tesouraria' : 'Formando'
}
