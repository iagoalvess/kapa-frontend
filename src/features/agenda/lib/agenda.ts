import { contemBusca } from '@/lib/busca'
import { diasAte, formatarMesLongo, formatarNumero } from '@/lib/formato'
import { type EventoDaTurma, jaPassou, type TipoDeEvento } from '@/types/agenda'

/**
 * Filtro e busca acontecem aqui, e não na API.
 *
 * A agenda vem inteira numa consulta só — são dezenas de datas na vida de uma turma —, então
 * filtrar no servidor custaria uma ida a cada pílula clicada para uma lista que já está na
 * memória. É a mesma decisão da tela da festa.
 *
 * @param eventos Todos os eventos da turma.
 * @param tipo Tipo escolhido, ou nulo para todos.
 * @param busca O que foi digitado, comparado sem acento no título, no local e na descrição.
 */
export function filtrar(eventos: readonly EventoDaTurma[], tipo: TipoDeEvento | null, busca: string) {
  return eventos.filter(
    (evento) =>
      (tipo === null || evento.tipo === tipo) &&
      contemBusca(busca, evento.titulo, evento.local, evento.descricao),
  )
}

/**
 * Os eventos agrupados por mês, na ordem em que já chegaram da API.
 *
 * O mês é a chave `yyyy-MM-01` — o primeiro dia —, que também serve de entrada para
 * `formatarMesLongo`. Mês sem evento não existe aqui: a distância entre dezembro e julho é o
 * próprio salto de um cabeçalho para o outro, que é o que substitui o calendário do modelo.
 *
 * @param eventos Eventos já ordenados por data.
 */
export function agruparPorMes(eventos: readonly EventoDaTurma[]) {
  const meses: { mes: string; eventos: EventoDaTurma[] }[] = []

  for (const evento of eventos) {
    const mes = `${evento.data.slice(0, 7)}-01`
    const ultimo = meses.at(-1)

    if (ultimo?.mes === mes) ultimo.eventos.push(evento)
    else meses.push({ mes, eventos: [evento] })
  }

  return meses
}

/**
 * Em que coluna o quadro abre: a do mês de hoje, ou a do primeiro mês que ainda vem.
 *
 * A turma que ainda não começou a marcar nada — e a que já se formou — caem no primeiro e no
 * último mês, que é o que sobra de sensato nos dois extremos.
 *
 * @param meses Os meses do quadro, do mais antigo para o mais novo.
 */
export function primeiroMesDaqui(meses: readonly { eventos: readonly EventoDaTurma[] }[]) {
  const daqui = meses.findIndex((mes) => mes.eventos.some((evento) => !jaPassou(evento)))

  return daqui === -1 ? Math.max(0, meses.length - 1) : daqui
}

/**
 * O que o quadro está mostrando, em texto: "Outubro de 2026 — Março de 2027".
 *
 * É o rótulo do deslizar: sem ele, as setas movem colunas e quem olha não sabe para onde foi —
 * os cabeçalhos das colunas dizem o mês, mas só depois de a pessoa procurar.
 *
 * @param janela Os meses à vista.
 */
export function intervalo(janela: readonly { mes: string }[]) {
  const primeiro = janela.at(0)
  const ultimo = janela.at(-1)

  if (!primeiro || !ultimo) return ''

  return primeiro.mes === ultimo.mes
    ? formatarMesLongo(primeiro.mes)
    : `${formatarMesLongo(primeiro.mes)} — ${formatarMesLongo(ultimo.mes)}`
}

/** O próximo evento que ainda vai acontecer e não foi cancelado. */
export function proximo(eventos: readonly EventoDaTurma[]) {
  return eventos.find((evento) => !jaPassou(evento) && evento.situacao !== 'Cancelado')
}

/** A data de um tipo único (colação, festa), ignorando o que foi cancelado. */
export function dataDoTipo(eventos: readonly EventoDaTurma[], tipo: 'Colacao' | 'Festa') {
  return eventos.find((evento) => evento.tipo === tipo && evento.situacao !== 'Cancelado')?.data ?? null
}

/** Quantos dias faltam, dito como se fala. */
export function emQuantosDias(data: string) {
  const dias = diasAte(data)

  if (dias === null) return undefined
  if (dias === 0) return 'é hoje'
  if (dias === 1) return 'é amanhã'

  return `em ${formatarNumero(dias)} dias`
}

/**
 * O que dizer quando o quadro está vazio — e são dois vazios diferentes.
 *
 * Turma sem data nenhuma é começo; quadro vazio com a turma cheia de datas é engano de filtro. Um
 * texto só para os dois mandaria a comissão criar evento quando o que ela precisa é tirar a pílula.
 *
 * @param total Quantos eventos a turma tem, sem filtro.
 * @param ehGestao Se quem olha pode marcar data.
 */
export function vazio(total: number, ehGestao = false) {
  if (total > 0) return { titulo: 'Nenhuma data encontrada', dica: 'Tente outra busca ou tire o filtro.' }

  return {
    titulo: 'A turma ainda não tem datas',
    dica: ehGestao
      ? 'Comece pelas duas que todo mundo pergunta: a colação e a festa.'
      : 'A comissão ainda não marcou nenhuma data.',
  }
}
