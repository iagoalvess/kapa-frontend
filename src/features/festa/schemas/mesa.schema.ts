import { z } from 'zod'
import { inteiroEmTexto } from '@/lib/esquemas'
import type { DadosDaMesa, Mesa } from '../types/mesas.types'

/** Forma da mesa. Nome repetido e reserva de mesa com dono voltam da API com o código. */
export const esquemaDeMesa = z.object({
  identificacao: z
    .string()
    .trim()
    .min(1, 'Informe como a mesa se chama.')
    .max(60, 'No máximo 60 caracteres.'),
  /** Texto porque o campo é um `<input>`; o número sai do `Number()` na conversão. */
  lugares: inteiroEmTexto(1, 40, 'De 1 a 40 lugares.'),
  observacao: z.string().trim().max(200, 'No máximo 200 caracteres.'),
  reservada: z.boolean(),
  formato: z.enum(['Redonda', 'Retangular']),
})

export type FormularioDaMesa = z.infer<typeof esquemaDeMesa>

/** Mesa em branco: 10 lugares, o tamanho mais comum de mesa de buffet. */
export const mesaEmBranco = (): FormularioDaMesa => ({
  identificacao: '',
  lugares: '10',
  observacao: '',
  reservada: false,
  formato: 'Redonda',
})

/** Uma mesa gravada, de volta ao formulário. */
export const paraFormularioDaMesa = (mesa: Mesa): FormularioDaMesa => ({
  identificacao: mesa.identificacao,
  lugares: String(mesa.lugares),
  observacao: mesa.observacao ?? '',
  reservada: mesa.reservada,
  formato: mesa.formato,
})

/** O formulário como a API o espera: observação vazia não vai como texto em branco. */
export const paraDadosDaMesa = (formulario: FormularioDaMesa): DadosDaMesa => ({
  identificacao: formulario.identificacao.trim(),
  lugares: Number(formulario.lugares),
  observacao: formulario.observacao.trim() || undefined,
  reservada: formulario.reservada,
  formato: formulario.formato,
})
