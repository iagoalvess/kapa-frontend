import type { PaginacaoRequest } from '@/types/paginacao'

/** O que faz um degrau da régua disparar. Espelha `GatilhoDaRegua` do backend. */
export type GatilhoDaRegua = 'Vencimento' | 'InformePendente'

/** Por onde a mensagem sai. Espelha `CanalDeNotificacao`. */
export type CanalDeNotificacao = 'Email' | 'Whatsapp'

/** O desfecho de um envio. Espelha `StatusDaNotificacao`. */
export type StatusDaNotificacao = 'Enfileirada' | 'Entregue' | 'Falhou'

/** O assunto de uma mensagem automática. Espelha `TipoDeNotificacao`. */
export type TipoDeNotificacao = 'Cobranca' | 'Aviso' | 'Adesao' | 'Sistema'

/** Como cada canal aparece na tela. */
export const ROTULOS_DE_CANAL = {
  Email: 'E-mail',
  Whatsapp: 'WhatsApp',
} as const satisfies Record<CanalDeNotificacao, string>

/** Como cada resultado aparece no histórico. */
export const ROTULOS_DE_STATUS = {
  Enfileirada: 'Na fila',
  Entregue: 'Entregue',
  Falhou: 'Falhou',
} as const satisfies Record<StatusDaNotificacao, string>

/** Como cada assunto aparece nas preferências. */
export const ROTULOS_DE_TIPO = {
  Cobranca: 'Cobrança de parcela',
  Aviso: 'Aviso do mural e assembleia',
  Adesao: 'Termo de adesão',
  Sistema: 'Recados da plataforma',
} as const satisfies Record<TipoDeNotificacao, string>

/** Uma linha embaixo de cada assunto, explicando o que ele manda. */
export const DICAS_DE_TIPO = {
  Cobranca: 'Parcela a vencer e parcela em atraso. Faz parte do termo de adesão e não pode ser desligada.',
  Aviso: 'Comunicado novo no mural e lembrete de assembleia.',
  Adesao: 'Termo publicado ou atualizado, à espera do seu aceite.',
  Sistema: 'Mudanças na conta e recados da Kapa.',
} as const satisfies Record<TipoDeNotificacao, string>

/** O canal que esta versão entrega; o WhatsApp entra na sprint seguinte, atrás da mesma interface. */
export const CANAIS_DISPONIVEIS: CanalDeNotificacao[] = ['Email']

/** Um degrau da régua. */
export interface Regra {
  id: string
  gatilho: GatilhoDaRegua
  /** Dias de distância do gatilho; negativo é antes do vencimento. */
  dias_de_deslocamento: number
  canal: CanalDeNotificacao
  assunto: string
  template: string
  ativa: boolean
  avisar_tesouraria: boolean
}

/** A régua da turma, com o que o editor precisa para não deixar passar erro. */
export interface Regua {
  regras: Regra[]
  /** As variáveis que um template aceita, sem as chaves. */
  variaveis: string[]
  tamanho_maximo: number
  tamanho_maximo_do_assunto: number
}

/** Um degrau, como a gravação o envia. */
export type DadosDaRegra = Omit<Regra, 'id'>

/** Uma linha do histórico de envios. */
export interface Notificacao {
  id: string
  destinatario: string
  /** Ausente no resumo à tesouraria, que não tem vínculo. */
  nome?: string
  assunto: string
  canal: CanalDeNotificacao
  status: StatusDaNotificacao
  /** Ausente enquanto não falhou. */
  erro?: string
  data_de_referencia: string
  enviada_em: string
  gatilho: GatilhoDaRegua
  dias_de_deslocamento: number
}

/** Filtros do histórico. */
export interface FiltroDeNotificacoes extends PaginacaoRequest {
  canal?: CanalDeNotificacao
  status?: StatusDaNotificacao
  busca?: string
}

/** O que o titular escolheu receber. */
export interface Preferencia {
  tipo: TipoDeNotificacao
  ativa: boolean
  /** Verdadeiro na cobrança: é comunicação do termo de adesão e não se desliga. */
  obrigatoria: boolean
}

/**
 * O nome curto de um degrau na linha do tempo: `D-5`, `D0`, `D+3`.
 *
 * @param regra Degrau.
 */
export function marcoDoDegrau(regra: Pick<Regra, 'gatilho' | 'dias_de_deslocamento'>) {
  if (regra.gatilho === 'InformePendente') return 'Fila'
  if (regra.dias_de_deslocamento === 0) return 'D0'
  return regra.dias_de_deslocamento < 0 ? `D${regra.dias_de_deslocamento}` : `D+${regra.dias_de_deslocamento}`
}

/**
 * O que o degrau significa, em palavras — o rótulo embaixo do ponto e o título do editor.
 *
 * @param regra Degrau.
 */
export function tomDoDegrau(regra: Pick<Regra, 'gatilho' | 'dias_de_deslocamento'>) {
  const dias = regra.dias_de_deslocamento

  if (regra.gatilho === 'InformePendente') return `Informe parado há ${dias} dias`
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
