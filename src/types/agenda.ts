/**
 * Que tipo de data é. Espelha `TipoDeEvento`.
 *
 * `Colacao` e `Festa` são únicas por turma — são as duas datas que até a Sprint 19 moravam em
 * colunas da formatura, e que a API ainda devolve em `previsao_de_colacao` e `previsao_da_festa`,
 * agora lidas destes eventos.
 */
export type TipoDeEvento = 'Colacao' | 'Festa' | 'Reuniao' | 'Prazo' | 'Outro'

/** Em que pé está a data. Espelha `SituacaoDoEvento`. */
export type SituacaoDoEvento = 'AConfirmar' | 'Confirmado' | 'Cancelado'

/** Os dois tipos que a turma só tem uma vez. */
export const TIPOS_UNICOS = ['Colacao', 'Festa'] as const satisfies readonly TipoDeEvento[]

/** O nome de cada tipo na tela. */
export const ROTULOS_DE_TIPO = {
  Colacao: 'Colação',
  Festa: 'Festa',
  Reuniao: 'Reunião',
  Prazo: 'Prazo',
  Outro: 'Outro',
} as const satisfies Record<TipoDeEvento, string>

/** O nome de cada situação na tela. */
export const ROTULOS_DE_SITUACAO = {
  AConfirmar: 'A confirmar',
  Confirmado: 'Confirmado',
  Cancelado: 'Cancelado',
} as const satisfies Record<SituacaoDoEvento, string>

/**
 * Uma data da turma. Espelha `EventoDTO`.
 *
 * Mora em `types/` porque duas features a leem: a agenda e a criação da formatura, que marca a
 * colação e a festa logo depois de a turma nascer.
 */
export interface EventoDaTurma {
  id: string
  titulo: string
  tipo: TipoDeEvento
  situacao: SituacaoDoEvento
  /** `yyyy-MM-dd`, sem hora nem fuso: é o dia do calendário da turma. */
  data: string
  /** `HH:mm:ss`. Nulo é evento de dia inteiro. */
  hora: string | null
  local: string | null
  descricao: string | null
}

/**
 * O que a Página Inicial mostra da agenda. Espelha `ResumoDaAgendaDTO`.
 *
 * Cancelado não entra: na tela da agenda ele continua na lista, com o selo, mas no bloco do Início
 * o espaço é do que vai acontecer.
 */
export interface ResumoDaAgenda {
  /** Até três datas, da mais perto para a mais longe. */
  proximos: EventoDaTurma[]
  /** Quantas datas ainda vêm, contando as que não couberam. */
  total: number
}

/** Um evento como a tela o envia. Espelha `EventoRequestDTO`. */
export interface DadosDoEvento {
  titulo: string
  tipo: TipoDeEvento
  situacao: SituacaoDoEvento
  data: string
  hora?: string
  local?: string
  descricao?: string
}

/** Se o evento já passou — o que a tela esconde atrás do "eventos anteriores". */
export function jaPassou(evento: EventoDaTurma, hoje = new Date()) {
  const referencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  return evento.data < referencia
}
