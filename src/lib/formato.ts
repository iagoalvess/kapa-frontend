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
 *
 * Data pura (`DateOnly` do backend: colação, nascimento) é o contrário: não é instante, é dia
 * do calendário. Lida como meia-noite UTC, ela vira 21h do dia anterior no Brasil.
 */
function paraData(valor: string | Date): Date {
  if (valor instanceof Date) return valor

  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (dia) return new Date(Number(dia[1]), Number(dia[2]) - 1, Number(dia[3]))

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
 * Valor em centavos, como a API de cobrança trafega, no formato `R$ 349,90`.
 *
 * A divisão acontece só aqui, na exibição: o valor em centavos é inteiro exato, e fazer conta com
 * reais em ponto flutuante é onde o centavo some.
 */
export function formatarCentavos(centavos: number | null | undefined) {
  return centavos === null || centavos === undefined ? VAZIO : MOEDA.format(centavos / 100)
}

/** CPF como `529.982.247-25`. O que não tiver 11 dígitos sai como veio. */
export function formatarCpf(cpf: string | null | undefined) {
  if (!cpf) return ''
  const d = cpf.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf
}

/** CEP como `80000-000`. O que não tiver 8 dígitos sai como veio. */
export function formatarCep(cep: string | null | undefined) {
  if (!cep) return ''
  const d = cep.replace(/\D/g, '')
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep
}

/**
 * Telefone brasileiro como `(41) 99876-5432`; de outro país, em E.164 como veio.
 *
 * A API grava e devolve E.164 (`+5541998765432`) — é formato de máquina, não de gente.
 */
export function formatarTelefone(telefone: string | null | undefined) {
  if (!telefone) return ''
  const d = telefone.replace(/\D/g, '')
  const nacional = telefone.startsWith('+55') ? d.slice(2) : telefone.startsWith('+') ? '' : d
  if (nacional.length !== 10 && nacional.length !== 11) return telefone
  return `(${nacional.slice(0, 2)}) ${nacional.slice(2, -4)}-${nacional.slice(-4)}`
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
