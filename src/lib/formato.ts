const LOCALIDADE = 'pt-BR'

const DATA = new Intl.DateTimeFormat(LOCALIDADE, { dateStyle: 'short' })
const DATA_HORA = new Intl.DateTimeFormat(LOCALIDADE, { dateStyle: 'short', timeStyle: 'short' })
const MES_ANO = new Intl.DateTimeFormat(LOCALIDADE, { month: 'short', year: 'numeric' })
const MES_CURTO = new Intl.DateTimeFormat(LOCALIDADE, { month: 'short', year: '2-digit' })
const MES_LONGO = new Intl.DateTimeFormat(LOCALIDADE, { month: 'long', year: 'numeric' })
const DIA_SEMANA = new Intl.DateTimeFormat(LOCALIDADE, { weekday: 'short' })
const DIA_MES = new Intl.DateTimeFormat(LOCALIDADE, { day: '2-digit', month: '2-digit' })
// en-CA sai como 2026-09-14: é só tirar os hífens.
const DATA_COMPACTA = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
const MOEDA = new Intl.NumberFormat(LOCALIDADE, { style: 'currency', currency: 'BRL' })
// `auto`: "ontem" e "amanhã" em vez de "há 1 dia" e "em 1 dia".
const RELATIVO = new Intl.RelativeTimeFormat(LOCALIDADE, { numeric: 'auto' })

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

/** Data como `20260914`, no fuso de quem está olhando — identificador técnico, como o da versão do termo. */
export function formatarDataCompacta(valor: string | Date | null | undefined) {
  return formatar(valor, DATA_COMPACTA).replaceAll('-', '')
}

/** Mês e ano, como `mar. de 2026` — o mês do primeiro vencimento. */
export function formatarMesAno(valor: string | Date | null | undefined) {
  return formatar(valor, MES_ANO)
}

/**
 * Mês por extenso, como `Outubro de 2026` — o cabeçalho que separa os meses da agenda.
 *
 * Abreviado ele não serve: "out. de 2026" num título grande parece texto cortado, e o cabeçalho é
 * o que substitui o calendário na tela.
 *
 * A maiúscula é daqui, e não do `capitalize` do CSS: a classe sobe a inicial de **toda** palavra e
 * escreve "Outubro De 2026". Só a primeira letra é nossa; o resto é o que o idioma manda.
 */
export function formatarMesLongo(valor: string | Date | null | undefined) {
  const mes = formatar(valor, MES_LONGO)

  return mes.charAt(0).toUpperCase() + mes.slice(1)
}

/**
 * O dia da semana abreviado, sem ponto: `qua` — o que vai embaixo do dia, no cartão da agenda.
 *
 * @param valor Data, tipicamente `yyyy-MM-dd`.
 */
export function formatarDiaDaSemana(valor: string | Date | null | undefined) {
  return formatar(valor, DIA_SEMANA).replace('.', '')
}

/**
 * Mês e ano curtos, como `mar./26`.
 *
 * É o rótulo de eixo de gráfico: `mar. de 2026` não cabe numa coluna de mês e os rótulos se
 * sobrepõem, virando uma tarja ilegível.
 */
export function formatarMesCurto(valor: string | Date | null | undefined) {
  return formatar(valor, MES_CURTO)
}

/**
 * Dia e mês, como `15/09` — data de canto, onde `15/09/2026` não cabe (o cabeçalho de uma coluna
 * estreita). Quem usa deixa a data inteira no `title`.
 */
export function formatarDiaMes(valor: string | Date | null | undefined) {
  return formatar(valor, DIA_MES)
}

/** Data e hora no formato `31/12/2026 14:05`, no fuso de quem está olhando. */
export function formatarDataHora(valor: string | Date | null | undefined) {
  return formatar(valor, DATA_HORA)
}

/**
 * A hora de um evento, como `19:30` — o `TimeOnly` da API, que vem `19:30:00`.
 *
 * Não passa por `Date` nem por fuso, de propósito: a hora de um evento da agenda não é um instante
 * em UTC, é "19h no ateliê", e continua sendo 19h em qualquer relógio que abra a tela. Converter
 * aqui é o que faria a reunião das 19h aparecer às 22h.
 *
 * @param valor Hora como `HH:mm` ou `HH:mm:ss`; nula é evento de dia inteiro.
 */
export function formatarHora(valor: string | null | undefined) {
  const hora = valor === null || valor === undefined ? null : /^(\d{2}:\d{2})/.exec(valor)

  return hora ? hora[1] : VAZIO
}

/**
 * Quantos dias do calendário faltam até a data — negativo se já passou, nulo se não há data.
 *
 * Conta dias, não horas: de hoje à noite para amanhã cedo é 1, e não 0. Por isso as duas pontas
 * vão para a meia-noite local antes da conta.
 *
 * @param valor Data de destino, tipicamente `yyyy-MM-dd`.
 * @param hoje Referência; o padrão é agora.
 */
export function diasAte(valor: string | null | undefined, hoje = new Date()) {
  if (!valor) return null

  const destino = paraData(valor)
  if (Number.isNaN(destino.getTime())) return null

  return Math.round((meiaNoite(destino) - meiaNoite(hoje)) / 86_400_000)
}

/**
 * Quanto tempo faz, como se fala: `agora`, `há 5 minutos`, `há 3 horas`, `ontem`, `anteontem`,
 * `há 3 dias`, `há 3 meses` — a data dos cartões do mural.
 *
 * Até um dia, conta horas; daí em diante, dias do calendário, como {@link diasAte}: o aviso de ontem
 * às 23h lido hoje às 8h é "há 9 horas", e o de anteontem às 23h já é "anteontem".
 *
 * @param valor Instante, como a API o devolve.
 * @param agora Referência; o padrão é agora.
 */
export function formatarDataRelativa(valor: string | Date | null | undefined, agora = new Date()) {
  if (valor === null || valor === undefined || valor === '') return VAZIO

  const data = paraData(valor)
  if (Number.isNaN(data.getTime())) return VAZIO

  const segundos = (data.getTime() - agora.getTime()) / 1000
  if (Math.abs(segundos) < 60) return 'agora'
  if (Math.abs(segundos) < 3600) return RELATIVO.format(Math.trunc(segundos / 60), 'minute')
  if (Math.abs(segundos) < 86_400) return RELATIVO.format(Math.trunc(segundos / 3600), 'hour')

  const dias = Math.round((meiaNoite(data) - meiaNoite(agora)) / 86_400_000)
  if (Math.abs(dias) < 30) return RELATIVO.format(dias, 'day')
  if (Math.abs(dias) < 365) return RELATIVO.format(Math.trunc(dias / 30), 'month')
  return RELATIVO.format(Math.trunc(dias / 365), 'year')
}

/**
 * Tamanho de arquivo como se lê: `850 bytes`, `320 KB`, `1,2 MB`.
 *
 * @param bytes Tamanho em bytes.
 */
export function formatarTamanho(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return VAZIO
  if (bytes < 1024) return `${formatarNumero(bytes)} bytes`
  if (bytes < 1024 * 1024) return `${formatarNumero(Math.round(bytes / 1024))} KB`
  return `${formatarNumero(bytes / (1024 * 1024), 1)} MB`
}

/**
 * O dia de hoje como `aaaa-mm-dd`, no calendário de quem está olhando — o valor de um `<input type="date">`.
 *
 * Montado à mão, e não por `toISOString`: aquele é UTC, e das 21h à meia-noite no Brasil já seria amanhã.
 *
 * @param agora Referência; o padrão é agora.
 */
export function diaDeHoje(agora = new Date()) {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`
}

const doisDigitos = (numero: number) => String(numero).padStart(2, '0')

const meiaNoite = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()

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

/** CNPJ como `11.222.333/0001-81` — também o alfanumérico. O que não tiver 14 posições sai como veio. */
export function formatarCnpj(cnpj: string | null | undefined) {
  if (!cnpj) return ''
  const c = cnpj.replace(/[^0-9a-z]/gi, '').toUpperCase()
  return c.length === 14
    ? `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`
    : cnpj
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

/**
 * Diz se o texto é uma data pura `AAAA-MM-DD` — o formato em que o filtro de período viaja na URL.
 *
 * A barra de endereço é editável: o que não estiver nessa forma não vira filtro, vira nada.
 */
export function ehDia(valor: string | null): valor is string {
  return valor !== null && /^\d{4}-\d{2}-\d{2}$/.test(valor)
}
