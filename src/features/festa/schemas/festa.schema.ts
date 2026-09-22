import { z } from 'zod'
import type { DadosDaProposta, DadosDoItemDaFesta, ItemDaFesta, Proposta } from '@/types/festa'

/*
  Validação de **forma**. O que depende do estado — item cancelado não aceita correção, item com
  despesa não se exclui — volta da API com o código (`festa.item_cancelado`, `festa.item_em_uso`) e
  a mensagem pronta.

  Dinheiro é inteiro em centavos do campo à API: o `CampoDeMoeda` já entrega centavos.
*/

const CATEGORIAS = [
  'Buffet',
  'Espaco',
  'Banda',
  'Fotografia',
  'Decoracao',
  'Convites',
  'Beca',
  'Taxas',
  'Outros',
] as const

export const esquemaDeItemDaFesta = z.object({
  titulo: z.string().trim().min(1, 'Informe o que é o item.').max(120, 'No máximo 120 caracteres.'),
  categoria: z.enum(CATEGORIAS),
  o_que_inclui: z.string().trim().max(2000, 'No máximo 2000 caracteres.'),
  documento_id: z.string(),
  rateio: z.enum(['Turma', 'PorFormando']),
  valor_previsto_em_centavos: z.number().int().min(0, 'O valor não pode ser negativo.'),
  /** Texto porque o campo é um `<input>`; o número sai do `Number()` na conversão. */
  quantidade_estimada: z
    .string()
    .trim()
    .refine(
      (valor) => /^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= 2000,
      'De 1 a 2000 formandos.',
    ),
})

export type FormularioDoItem = z.infer<typeof esquemaDeItemDaFesta>

/** O formulário vazio: rateado pela turma, categoria Buffet — o item mais caro e o mais comum. */
export const itemEmBranco = (): FormularioDoItem => ({
  titulo: '',
  categoria: 'Buffet',
  o_que_inclui: '',
  documento_id: '',
  rateio: 'Turma',
  valor_previsto_em_centavos: 0,
  quantidade_estimada: '1',
})

/** Um item gravado, de volta ao formulário. */
export const paraFormularioDoItem = (item: ItemDaFesta): FormularioDoItem => ({
  titulo: item.titulo,
  categoria: item.categoria,
  o_que_inclui: item.o_que_inclui ?? '',
  documento_id: item.documento?.id ?? '',
  rateio: item.rateio,
  valor_previsto_em_centavos: item.valor_previsto_em_centavos,
  quantidade_estimada: String(item.quantidade_estimada),
})

/** O que o formulário vira na API: campo vazio não vai como texto em branco. */
export function paraDadosDoItem(formulario: FormularioDoItem): DadosDoItemDaFesta {
  return {
    titulo: formulario.titulo.trim(),
    categoria: formulario.categoria,
    o_que_inclui: formulario.o_que_inclui.trim() || undefined,
    documento_id: formulario.documento_id || undefined,
    rateio: formulario.rateio,
    valor_previsto_em_centavos: formulario.valor_previsto_em_centavos,
    quantidade_estimada: formulario.rateio === 'Turma' ? 1 : Number(formulario.quantidade_estimada),
  }
}

export const esquemaDeProposta = z.object({
  titulo: z.string().trim().min(1, 'Informe quem está propondo.').max(120, 'No máximo 120 caracteres.'),
  valor_em_centavos: z.number().int().min(0, 'O valor não pode ser negativo.'),
  o_que_inclui: z.string().trim().max(1000, 'No máximo 1000 caracteres.'),
})

export type FormularioDaProposta = z.infer<typeof esquemaDeProposta>

/** O formulário vazio de uma proposta. */
export const propostaEmBranco = (): FormularioDaProposta => ({
  titulo: '',
  valor_em_centavos: 0,
  o_que_inclui: '',
})

/** Uma proposta gravada, de volta ao formulário. */
export const paraFormularioDaProposta = (proposta: Proposta): FormularioDaProposta => ({
  titulo: proposta.titulo,
  valor_em_centavos: proposta.valor_em_centavos,
  o_que_inclui: proposta.o_que_inclui ?? '',
})

/** O que o formulário vira na API: campo vazio não vai como texto em branco. */
export function paraDadosDaProposta(formulario: FormularioDaProposta): DadosDaProposta {
  return {
    titulo: formulario.titulo.trim(),
    valor_em_centavos: formulario.valor_em_centavos,
    o_que_inclui: formulario.o_que_inclui.trim() || undefined,
  }
}
