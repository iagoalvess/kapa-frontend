const LOCALIDADE = 'pt-BR'

const DATA = new Intl.DateTimeFormat(LOCALIDADE, { dateStyle: 'short' })
const DATA_HORA = new Intl.DateTimeFormat(LOCALIDADE, { dateStyle: 'short', timeStyle: 'short' })
const MOEDA = new Intl.NumberFormat(LOCALIDADE, { style: 'currency', currency: 'BRL' })

/** Texto exibido no lugar de um valor ausente ou ilegível. */
const VAZIO = '—'

/**
 * Converte o que veio do JSON em `Date`.
 *
 * O backend grava tudo em UTC, mas nem todo serializador marca o fuso na string. Sem a marca,
 * o navegador interpreta como hora **local** e a data aparece deslocada — no Brasil, três horas
 * para trás, o que troca o dia de toda operação feita à noite.
 */
function paraData(valor: string | Date): Date {
  if (valor instanceof Date) return valor

  const temFuso = /([Zz]|[+-]\d{2}:?\d{2})$/.test(valor)
  return new Date(temFuso ? valor : `${valor}Z`)
}

function formatar(valor: string | Date | null | undefined, formatador: Intl.DateTimeFormat) {
  if (valor === null || valor === undefined || valor === '') return VAZIO

  const data = paraData(valor)
  return Number.isNaN(data.getTime()) ? VAZIO : formatador.format(data)
}

/** Data no formato `31/12/2026`, no fuso de quem está olhando. */
export function formatarData(valor: string | Date | null | undefined) {
  return formatar(valor, DATA)
}

/** Data e hora no formato `31/12/2026 14:05`, no fuso de quem está olhando. */
export function formatarDataHora(valor: string | Date | null | undefined) {
  return formatar(valor, DATA_HORA)
}

/** Valor em reais, no formato `R$ 1.234,56`. */
export function formatarMoeda(valor: number | null | undefined) {
  return valor === null || valor === undefined ? VAZIO : MOEDA.format(valor)
}

/**
 * Número com separador de milhar.
 *
 * @param valor Número a formatar.
 * @param casas Casas decimais, fixas.
 */
export function formatarNumero(valor: number | null | undefined, casas = 0) {
  if (valor === null || valor === undefined) return VAZIO

  return valor.toLocaleString(LOCALIDADE, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}
