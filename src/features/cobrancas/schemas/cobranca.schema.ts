import { z } from 'zod'
import { formatarNumero } from '@/lib/formato'
import type { DadosDoItem, DadosDoPlano, ItemDeCobranca, PlanoDeCobranca } from '../types/cobrancas.types'

/*
  Validação de **forma**. O que depende do plano — adesão única, item em uso — volta da API com o
  código (`cobranca.adesao_duplicada`, `cobranca.item_em_uso`) e a mensagem pronta.

  Dinheiro é inteiro em centavos do campo à API: o `CampoDeMoeda` já entrega centavos, e a única
  conta aqui é "por parcela × parcelas" — multiplicação de inteiros, exata. A divisão (e o centavo
  que sobra) é do servidor, que devolve a grade pela simulação.
*/

/** Acima destes, a tela avisa — sem travar (decisão de 14/09/2026). Base 10.000. */
export const LIMITES_DE_MERCADO = { multa: 200, jurosAoMes: 100 } as const

const TIPOS = ['Mensalidade', 'Adesao', 'Rifa', 'ConviteExtra', 'Avulsa'] as const

const inteiro = (minimo: number, maximo: number, mensagem: string) =>
  z
    .string()
    .trim()
    .refine((valor) => /^\d+$/.test(valor) && Number(valor) >= minimo && Number(valor) <= maximo, mensagem)

/** O mês de hoje no formato do `<input type="month">` — o piso do rateio. */
export const mesCorrente = (hoje = new Date()) =>
  `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

export const esquemaDeItem = z
  .object({
    tipo: z.enum(TIPOS),
    descricao: z.string().trim().max(120, 'A descrição deve ter no máximo 120 caracteres.'),
    /** `parcela`: o valor digitado é o de cada parcela; `total`: o de todas juntas. */
    modoDoValor: z.enum(['parcela', 'total']),
    valor_em_centavos: z.number().int().positive('Informe um valor maior que zero.'),
    numero_de_parcelas: inteiro(1, 120, 'De 1 a 120 parcelas.'),
    dia_de_vencimento: inteiro(1, 31, 'Escolha um dia de 1 a 31.'),
    primeiro_mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês, como 2026-03.'),
    /** Rateio extraordinário: o item cobra também quem já aderiu. */
    aplicar_a_quem_ja_aderiu: z.boolean(),
    origem_da_decisao: z.string().trim().max(200, 'A origem deve ter no máximo 200 caracteres.'),
  })
  // O rateio cobra gente que não aceitou este item: sem a origem da decisão e com o primeiro mês
  // no passado, a API recusa — e é melhor dizer isso antes de a pessoa clicar.
  .superRefine((valores, contexto) => {
    if (!valores.aplicar_a_quem_ja_aderiu) return

    if (!valores.origem_da_decisao)
      contexto.addIssue({
        code: 'custom',
        path: ['origem_da_decisao'],
        message: 'Informe onde a turma decidiu esta cobrança — a assembleia e a data.',
      })

    if (valores.primeiro_mes < mesCorrente())
      contexto.addIssue({
        code: 'custom',
        path: ['primeiro_mes'],
        message: 'O rateio não pode começar num mês que já passou: a parcela nasceria vencida.',
      })
  })

export type FormularioDeItem = z.infer<typeof esquemaDeItem>

/** Mês que vem, no formato do `<input type="month">`: o primeiro vencimento mais comum. */
function proximoMes(hoje = new Date()) {
  const mes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
  return `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
}

/** O formulário vazio: mensalidade, por parcela, todo dia 10, a partir do mês que vem. */
export const itemEmBranco = (): FormularioDeItem => ({
  tipo: 'Mensalidade',
  descricao: '',
  modoDoValor: 'parcela',
  valor_em_centavos: 0,
  numero_de_parcelas: '24',
  dia_de_vencimento: '10',
  primeiro_mes: proximoMes(),
  aplicar_a_quem_ja_aderiu: false,
  origem_da_decisao: '',
})

/**
 * O que o formulário vira na API: o valor sempre como total.
 *
 * O rateio só viaja quando está marcado — a simulação e a alteração mandam os mesmos dados, e um
 * `false` a mais em todo lugar só faria pensar que a API o lê nos três.
 *
 * @param formulario Valores já validados pelo esquema.
 */
export function paraDadosDoItem(formulario: FormularioDeItem): DadosDoItem {
  const parcelas = Number(formulario.numero_de_parcelas)

  return {
    tipo: formulario.tipo,
    descricao: formulario.descricao.trim() || undefined,
    valor_em_centavos:
      formulario.modoDoValor === 'parcela'
        ? formulario.valor_em_centavos * parcelas
        : formulario.valor_em_centavos,
    numero_de_parcelas: parcelas,
    dia_de_vencimento: Number(formulario.dia_de_vencimento),
    primeiro_mes: `${formulario.primeiro_mes}-01`,
    ...(formulario.aplicar_a_quem_ja_aderiu
      ? { aplicar_a_quem_ja_aderiu: true, origem_da_decisao: formulario.origem_da_decisao.trim() }
      : {}),
  }
}

/**
 * Um item gravado, de volta ao formulário. Se o total divide exato pelas parcelas, abre "por
 * parcela" — é como a tesouraria pensa ("R$ 350 por mês"); senão, "total", sem inventar centavo.
 */
export function paraFormularioDeItem(item: DadosDoItem): FormularioDeItem {
  const exato = item.valor_em_centavos % item.numero_de_parcelas === 0

  return {
    tipo: item.tipo,
    descricao: item.descricao ?? '',
    modoDoValor: exato ? 'parcela' : 'total',
    valor_em_centavos: exato ? item.valor_em_centavos / item.numero_de_parcelas : item.valor_em_centavos,
    numero_de_parcelas: String(item.numero_de_parcelas),
    dia_de_vencimento: String(item.dia_de_vencimento),
    primeiro_mes: item.primeiro_mes.slice(0, 7),
    aplicar_a_quem_ja_aderiu: false,
    origem_da_decisao: item.origem_da_decisao ?? '',
  }
}

/** Um item gravado na forma que a simulação recebe. */
export const dadosDe = ({
  tipo,
  descricao,
  valor_em_centavos,
  numero_de_parcelas,
  dia_de_vencimento,
  primeiro_mes,
}: ItemDeCobranca): DadosDoItem => ({
  tipo,
  descricao,
  valor_em_centavos,
  numero_de_parcelas,
  dia_de_vencimento,
  primeiro_mes,
})

/** `2,5` ou `2.5` em base 10.000 (250). Nulo se não for um percentual de até duas casas. */
export function lerPercentual(texto: string) {
  const normalizado = texto.trim().replace(',', '.')
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalizado)) return null

  return Math.round(Number(normalizado) * 100)
}

const percentual = (rotulo: string) =>
  z
    .string()
    .trim()
    .refine((valor) => {
      const base = lerPercentual(valor)
      return base !== null && base <= 10_000
    }, `${rotulo} vai de 0 a 100%, com até duas casas.`)

export const esquemaDoPlano = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, 'Dê um nome ao plano.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
    multa: percentual('A multa'),
    jurosAoMes: percentual('Os juros'),
    carencia_em_dias: inteiro(0, 60, 'De 0 a 60 dias.'),
    descontoPorAntecipacao: percentual('O desconto'),
    dias_minimos_para_desconto: inteiro(0, 365, 'De 0 a 365 dias.'),
  })
  // Sem antecedência mínima, "5% para quem quitar à vista" vira 5% para quem paga um dia antes — a
  // turma inteira ganhando o desconto todo mês. A API recusa com `cobranca.antecedencia_obrigatoria`.
  .superRefine((valores, contexto) => {
    if (
      (lerPercentual(valores.descontoPorAntecipacao) ?? 0) > 0 &&
      Number(valores.dias_minimos_para_desconto) === 0
    )
      contexto.addIssue({
        code: 'custom',
        path: ['dias_minimos_para_desconto'],
        message: 'Diga com quantos dias de antecedência o desconto vale.',
      })
  })

export type FormularioDoPlano = z.infer<typeof esquemaDoPlano>

/** Um plano novo já nasce no patamar que o mercado aceita: 2% de multa, 1% de juros ao mês. */
export const planoEmBranco = (): FormularioDoPlano => ({
  nome: 'Plano da turma',
  multa: '2',
  jurosAoMes: '1',
  carencia_em_dias: '0',
  descontoPorAntecipacao: '0',
  dias_minimos_para_desconto: '0',
})

/** Base 10.000 como o campo mostra: `250` vira `2,50`. */
const paraTexto = (base: number) => formatarNumero(base / 100, 2)

export function paraFormularioDoPlano(plano: PlanoDeCobranca): FormularioDoPlano {
  return {
    nome: plano.nome,
    multa: paraTexto(plano.percentual_de_multa),
    jurosAoMes: paraTexto(plano.percentual_de_juros_ao_mes),
    carencia_em_dias: String(plano.carencia_em_dias),
    descontoPorAntecipacao: paraTexto(plano.percentual_de_desconto_por_antecipacao),
    dias_minimos_para_desconto: String(plano.dias_minimos_para_desconto),
  }
}

/** @param formulario Valores já validados pelo esquema. */
export function paraDadosDoPlano(formulario: FormularioDoPlano): DadosDoPlano {
  return {
    nome: formulario.nome.trim(),
    percentual_de_multa: lerPercentual(formulario.multa) ?? 0,
    percentual_de_juros_ao_mes: lerPercentual(formulario.jurosAoMes) ?? 0,
    carencia_em_dias: Number(formulario.carencia_em_dias),
    percentual_de_desconto_por_antecipacao: lerPercentual(formulario.descontoPorAntecipacao) ?? 0,
    dias_minimos_para_desconto: Number(formulario.dias_minimos_para_desconto),
  }
}
