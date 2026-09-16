import { Chip } from '@/components/Chip'
import { diaDeHoje } from '@/lib/formato'
import { cn } from '@/lib/utils'

/**
 * As faixas de vencimento do filtro, como `[de, ate]` em `aaaa-mm-dd`.
 *
 * Calculadas no calendário local — `diaDeHoje` monta a data à mão justamente para as 21h de hoje
 * no Brasil não virarem amanhã em UTC. A semana vai de segunda a domingo.
 *
 * @param hoje Referência; o padrão é agora.
 */
export function faixasDeVencimento(hoje = new Date()) {
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const dia = hoje.getDate()
  // `getDay()` conta do domingo; deslocando em 6 a segunda vira 0 e a semana fecha no domingo.
  const desdeSegunda = (hoje.getDay() + 6) % 7

  return {
    'Esta semana': [
      diaDeHoje(new Date(ano, mes, dia - desdeSegunda)),
      diaDeHoje(new Date(ano, mes, dia - desdeSegunda + 6)),
    ],
    // Dia 0 do mês seguinte é o último dia deste; dezembro rola o ano sozinho.
    'Este mês': [diaDeHoje(new Date(ano, mes, 1)), diaDeHoje(new Date(ano, mes + 1, 0))],
    'Próximos 30 dias': [diaDeHoje(hoje), diaDeHoje(new Date(ano, mes, dia + 30))],
    'Este ano': [diaDeHoje(new Date(ano, 0, 1)), diaDeHoje(new Date(ano, 11, 31))],
  } satisfies Record<string, [string, string]>
}

/**
 * As faixas de publicação, como `[de, ate]` — as mesmas do vencimento, olhando para trás: o mural
 * pergunta o que saiu, e não o que vai vencer.
 *
 * @param hoje Referência; o padrão é agora.
 */
export function faixasDePublicacao(hoje = new Date()) {
  const { 'Esta semana': semana, 'Este mês': mes, 'Este ano': ano } = faixasDeVencimento(hoje)

  return {
    'Esta semana': semana,
    'Este mês': mes,
    'Últimos 30 dias': [
      diaDeHoje(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 30)),
      diaDeHoje(hoje),
    ],
    'Este ano': ano,
  } satisfies Record<string, [string, string]>
}

/**
 * O filtro de período do painel de filtros, no mesmo vocabulário do resto da tela: faixas prontas
 * em pílulas, uma ligada por vez. Cada tela diz o que se filtra — vencimento nas de dinheiro,
 * publicação no mural.
 *
 * As pílulas gravam datas de verdade em `de`/`ate` — não existe um terceiro estado guardado em
 * lugar nenhum. Por isso a pílula acende quando o intervalo na URL bate com o dela, e um intervalo
 * digitado à mão na URL simplesmente não acende nenhuma.
 *
 * @param faixas As faixas oferecidas; o padrão é o vencimento, que olha para a frente.
 * @param aoMudar Recebe as duas pontas do intervalo — sempre as duas, para caber no `atualizar` de
 *   cada tela, que grava um punhado de parâmetros na URL de uma vez. `null` apaga a ponta.
 */
export function FiltroDePeriodo({
  de,
  ate,
  aoMudar,
  legenda = 'Vencimento',
  faixas = faixasDeVencimento(),
  className,
}: {
  de: string | undefined
  ate: string | undefined
  aoMudar: (faixa: { de: string | null; ate: string | null }) => void
  legenda?: string
  faixas?: Record<string, [string, string]>
  className?: string
}) {
  return (
    <fieldset className={cn('grid gap-2', className)}>
      <legend className="text-muted-foreground mb-2 text-sm">{legenda}</legend>

      <div className="flex flex-wrap gap-2">
        {Object.entries(faixas).map(([rotulo, [inicio, fim]]) => {
          const ativo = de === inicio && ate === fim
          return (
            <Chip
              key={rotulo}
              ativo={ativo}
              onClick={() => aoMudar(ativo ? { de: null, ate: null } : { de: inicio, ate: fim })}
            >
              {rotulo}
            </Chip>
          )
        })}
      </div>
    </fieldset>
  )
}
