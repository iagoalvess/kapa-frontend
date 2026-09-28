import { z } from 'zod'
import { diaDeHoje } from '@/lib/formato'
import { inteiroEmTexto } from '@/lib/esquemas'
import { CATEGORIAS_DE_DESPESA, CATEGORIAS_DE_OUTRA_RECEITA } from '@/types/financeiro'
import type { ItemDaFesta } from '@/types/festa'
import type {
  DadosDaDespesa,
  DadosDaOutraReceita,
  DadosDoFornecedor,
  Despesa,
  Fornecedor,
  NovaDespesa,
  NovaOutraReceita,
  OutraReceita,
} from '../types/financeiro.types'

/*
  Validação de **forma**. O que depende do estado — fornecedor em uso, despesa duplicada — volta da
  API com o código (`financeiro.fornecedor_em_uso`, `financeiro.despesa_duplicada`) e a mensagem
  pronta.

  Dinheiro é inteiro em centavos do campo à API: o `CampoDeMoeda` já entrega centavos.
*/

const DIA = /^\d{4}-\d{2}-\d{2}$/

export const esquemaDeFornecedor = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do fornecedor.').max(200, 'No máximo 200 caracteres.'),
  documento: z.string().trim().max(20, 'Confira o documento.'),
  categoria: z.enum(CATEGORIAS_DE_DESPESA),
  telefone: z.string().trim().max(20, 'Confira o telefone.'),
  email: z.union([z.literal(''), z.email('Informe um e-mail válido.')]),
  observacoes: z.string().trim().max(1000, 'No máximo 1000 caracteres.'),
  ativo: z.boolean(),
})

export type FormularioDeFornecedor = z.infer<typeof esquemaDeFornecedor>

/** O formulário vazio: fornecedor ativo, categoria Buffet — a que mais se contrata. */
export const fornecedorEmBranco = (): FormularioDeFornecedor => ({
  nome: '',
  documento: '',
  categoria: 'Buffet',
  telefone: '',
  email: '',
  observacoes: '',
  ativo: true,
})

/** Um fornecedor gravado, de volta ao formulário. */
export const paraFormularioDeFornecedor = (fornecedor: Fornecedor): FormularioDeFornecedor => ({
  nome: fornecedor.nome,
  documento: fornecedor.documento ?? '',
  categoria: fornecedor.categoria,
  telefone: fornecedor.telefone ?? '',
  email: fornecedor.email ?? '',
  observacoes: fornecedor.observacoes ?? '',
  ativo: fornecedor.ativo,
})

/** O que o formulário vira na API: campo vazio não vai como texto em branco. */
export function paraDadosDoFornecedor(formulario: FormularioDeFornecedor): DadosDoFornecedor {
  return {
    nome: formulario.nome.trim(),
    documento: formulario.documento.trim() || undefined,
    categoria: formulario.categoria,
    telefone: formulario.telefone.trim() || undefined,
    email: formulario.email.trim() || undefined,
    observacoes: formulario.observacoes.trim() || undefined,
    ativo: formulario.ativo,
  }
}

/**
 * O lançamento, na ordem em que o tesoureiro pensa: o que foi, quanto, de quem, quando vence,
 * parcelas — e, se já pagou, quando e o comprovante.
 */
export const esquemaDeDespesa = z
  .object({
    descricao: z.string().trim().min(1, 'Diga o que é a despesa.').max(200, 'No máximo 200 caracteres.'),
    valor_em_centavos: z.number().int().positive('Informe um valor maior que zero.'),
    /** `parcela`: o valor digitado é o de cada parcela; `total`: o de todas juntas. */
    modoDoValor: z.enum(['parcela', 'total']),
    fornecedor_id: z.string(),
    item_da_festa_id: z.string(),
    categoria: z.enum(CATEGORIAS_DE_DESPESA),
    competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês, como 2026-03.'),
    vencimento: z.string().regex(DIA, 'Informe o vencimento.'),
    numero_de_parcelas: inteiroEmTexto(1, 24, 'De 1 a 24 parcelas.'),
    jaPaga: z.boolean(),
    paga_em: z.string(),
  })
  .refine((valores) => !valores.jaPaga || DIA.test(valores.paga_em), {
    message: 'Informe a data do pagamento.',
    path: ['paga_em'],
  })
  .refine((valores) => !valores.jaPaga || valores.paga_em <= diaDeHoje(), {
    message: 'A data do pagamento não pode estar no futuro.',
    path: ['paga_em'],
  })

export type FormularioDeDespesa = z.infer<typeof esquemaDeDespesa>

/** O mês do `<input type="month">` a partir de um dia. */
const mesDo = (dia: string) => dia.slice(0, 7)

/** O formulário vazio: à vista, competência e vencimento hoje — o lançamento mais comum. */
export const despesaEmBranco = (): FormularioDeDespesa => ({
  descricao: '',
  valor_em_centavos: 0,
  modoDoValor: 'total',
  fornecedor_id: '',
  item_da_festa_id: '',
  categoria: 'Buffet',
  competencia: mesDo(diaDeHoje()),
  vencimento: diaDeHoje(),
  numero_de_parcelas: '1',
  jaPaga: false,
  paga_em: diaDeHoje(),
})

/** Uma despesa gravada, de volta ao formulário — a correção mexe numa linha só. */
export const paraFormularioDeDespesa = (despesa: Despesa): FormularioDeDespesa => ({
  descricao: despesa.descricao,
  valor_em_centavos: despesa.valor_em_centavos,
  modoDoValor: 'total',
  fornecedor_id: despesa.fornecedor_id ?? '',
  item_da_festa_id: despesa.item_da_festa_id ?? '',
  categoria: despesa.categoria,
  competencia: mesDo(despesa.competencia),
  vencimento: despesa.vencimento,
  numero_de_parcelas: '1',
  jaPaga: false,
  paga_em: despesa.pago_em ?? diaDeHoje(),
})

/** O lançamento novo, como a API o espera: o valor sempre como total do compromisso. */
export function paraNovaDespesa(formulario: FormularioDeDespesa): NovaDespesa {
  const parcelas = Number(formulario.numero_de_parcelas)

  return {
    fornecedor_id: formulario.fornecedor_id || undefined,
    item_da_festa_id: formulario.item_da_festa_id || undefined,
    descricao: formulario.descricao.trim(),
    categoria: formulario.categoria,
    valor_em_centavos:
      formulario.modoDoValor === 'parcela'
        ? formulario.valor_em_centavos * parcelas
        : formulario.valor_em_centavos,
    numero_de_parcelas: parcelas,
    competencia: `${formulario.competencia}-01`,
    vencimento: formulario.vencimento,
    paga_em: formulario.jaPaga ? formulario.paga_em : undefined,
  }
}

/** A correção de uma linha: o valor é o dela, sem dividir nada. */
export function paraDadosDaDespesa(formulario: FormularioDeDespesa): DadosDaDespesa {
  return {
    fornecedor_id: formulario.fornecedor_id || undefined,
    item_da_festa_id: formulario.item_da_festa_id || undefined,
    descricao: formulario.descricao.trim(),
    categoria: formulario.categoria,
    valor_em_centavos: formulario.valor_em_centavos,
    competencia: `${formulario.competencia}-01`,
    vencimento: formulario.vencimento,
  }
}

/** O pagamento de uma despesa: dia e comprovante, que é obrigatório (decisão 3). */
export const esquemaDePagamento = z.object({
  pago_em: z
    .string()
    .regex(DIA, 'Informe a data do pagamento.')
    .refine((dia) => dia <= diaDeHoje(), 'A data do pagamento não pode estar no futuro.'),
})

export type FormularioDePagamento = z.infer<typeof esquemaDePagamento>

/**
 * O lançamento que nasce do botão "Contratar" do cartão da festa.
 *
 * Preenche o que o item já sabe — descrição, categoria, valor e o próprio vínculo —, e deixa para a
 * tesouraria só o que ele não sabe: fornecedor, parcelas e vencimento. É o que evita o mesmo dado
 * digitado duas vezes, uma em cada tela.
 *
 * O valor vem do custo do item, e não do valor por formando: o que a turma deve ao fotógrafo é o
 * preço vezes quantos compraram, não o preço de um.
 */
export const despesaParaContratar = (item: ItemDaFesta): FormularioDeDespesa => ({
  ...despesaEmBranco(),
  descricao: item.titulo,
  categoria: item.categoria,
  valor_em_centavos: item.custo_previsto_em_centavos,
  item_da_festa_id: item.id,
})

/**
 * A receita, espelho da despesa (decisão 1 da Sprint 28) sem parcela nem fornecedor: o que é, de
 * quem, quanto, quando — e se já caiu na conta. Já recebida, a data é a do dinheiro na conta e não
 * pode estar no futuro; prevista, é o dia combinado.
 */
export const esquemaDeOutraReceita = z
  .object({
    descricao: z.string().trim().min(1, 'Diga o que é a receita.').max(200, 'No máximo 200 caracteres.'),
    origem: z.string().trim().max(200, 'No máximo 200 caracteres.'),
    categoria: z.enum(CATEGORIAS_DE_OUTRA_RECEITA),
    valor_em_centavos: z.number().int().positive('Informe um valor maior que zero.'),
    data: z.string().regex(DIA, 'Informe a data.'),
    recebida: z.boolean(),
    documento_id: z.string(),
  })
  .refine((valores) => !valores.recebida || valores.data <= diaDeHoje(), {
    message: 'Receita já recebida não pode ter data no futuro.',
    path: ['data'],
  })

export type FormularioDeOutraReceita = z.infer<typeof esquemaDeOutraReceita>

/** O formulário vazio: já recebida hoje — o lançamento mais comum é o do dinheiro que já entrou. */
export const outraReceitaEmBranco = (): FormularioDeOutraReceita => ({
  descricao: '',
  origem: '',
  categoria: 'Patrocinio',
  valor_em_centavos: 0,
  data: diaDeHoje(),
  recebida: true,
  documento_id: '',
})

/** Uma receita gravada, de volta ao formulário. */
export const paraFormularioDeOutraReceita = (outraReceita: OutraReceita): FormularioDeOutraReceita => ({
  descricao: outraReceita.descricao,
  origem: outraReceita.origem ?? '',
  categoria: outraReceita.categoria,
  valor_em_centavos: outraReceita.valor_em_centavos,
  data: outraReceita.data,
  recebida: outraReceita.status === 'Recebida',
  documento_id: outraReceita.documento?.id ?? '',
})

/** A correção, como a API a espera: situação não se muda editando — é em Receber e Cancelar. */
export function paraDadosDaOutraReceita(formulario: FormularioDeOutraReceita): DadosDaOutraReceita {
  return {
    descricao: formulario.descricao.trim(),
    origem: formulario.origem.trim() || undefined,
    categoria: formulario.categoria,
    valor_em_centavos: formulario.valor_em_centavos,
    data: formulario.data,
    documento_id: formulario.documento_id || undefined,
  }
}

/** O lançamento novo: a correção mais o "já recebida". */
export const paraNovaOutraReceita = (formulario: FormularioDeOutraReceita): NovaOutraReceita => ({
  ...paraDadosDaOutraReceita(formulario),
  recebida: formulario.recebida,
})

/** O recebimento de uma receita prevista: o dia em que o dinheiro caiu na conta. */
export const esquemaDeRecebimento = z.object({
  recebida_em: z
    .string()
    .regex(DIA, 'Informe a data do recebimento.')
    .refine((dia) => dia <= diaDeHoje(), 'A data do recebimento não pode estar no futuro.'),
})

export type FormularioDeRecebimento = z.infer<typeof esquemaDeRecebimento>
