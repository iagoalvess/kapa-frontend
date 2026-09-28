import { z } from 'zod'
import { inteiroEmTexto } from '@/lib/esquemas'
import type { DadosDaCota, PainelDaCota } from '@/types/festa'

/** Forma da cota. Diminuir depois de aberta volta da API com `festa.cota_ja_aberta`. */
export const esquemaDaCota = z.object({
  /** Texto porque o campo é um `<input>`; o número sai do `Number()` na conversão. */
  cota_por_formando: inteiroEmTexto(1, 10, 'De 1 a 10 convites por formando.'),
  /** Vazio é "não sei": a conta aparece sem o aviso de capacidade. */
  capacidade: z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || (/^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= 100_000),
      'De 1 a 100.000 lugares.',
    ),
})

export type FormularioDaCota = z.infer<typeof esquemaDaCota>

/** O painel gravado, de volta ao formulário. Sem cota ainda, sugere dois — a regra comum. */
export const paraFormularioDaCota = (painel: PainelDaCota): FormularioDaCota => ({
  cota_por_formando: String(painel.cota_por_formando ?? 2),
  capacidade: painel.capacidade === null ? '' : String(painel.capacidade),
})

/** O formulário como a API o espera. */
export const paraDadosDaCota = (formulario: FormularioDaCota): DadosDaCota => ({
  cota_por_formando: Number(formulario.cota_por_formando),
  capacidade: formulario.capacidade === '' ? null : Number(formulario.capacidade),
})
