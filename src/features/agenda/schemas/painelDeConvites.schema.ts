import { z } from 'zod'

/** A capacidade do local: vazio é "não sei", e a conta aparece sem o aviso. */
export const esquemaDaCapacidade = z.object({
  capacidade: z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || (/^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= 100_000),
      'De 1 a 100.000 lugares.',
    ),
})

export type FormularioDaCapacidade = z.infer<typeof esquemaDaCapacidade>
