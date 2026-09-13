import { z } from 'zod'
import { PAPEIS } from '@/config/perfis'

/*
  Validação de **forma**. Quem pode oferecer papel de comissão é o backend quem decide
  (`convite.papel_restrito`) — a tela só esconde a escolha de quem não é Presidente.
*/

/** Validades oferecidas para o link da turma, em dias. O backend aceita de 1 a 180. */
export const VALIDADES_DO_LINK = [7, 30, 90, 180] as const

/** Convite nominal: um e-mail, um uso. */
export const esquemaDeConviteNominal = z.object({
  email: z.email('Informe um e-mail válido.'),
  papel: z.enum(Object.values(PAPEIS)),
})

/** Link aberto da turma. O limite vem como texto do `<input>`; vazio é ilimitado. */
export const esquemaDeLinkDaTurma = z.object({
  diasDeValidade: z.string(),
  usosMaximos: z
    .string()
    .refine(
      (valor) => valor.trim() === '' || (Number.isInteger(Number(valor)) && Number(valor) >= 1),
      'Informe um número inteiro a partir de 1, ou deixe em branco.',
    ),
})

export type FormularioDeConviteNominal = z.infer<typeof esquemaDeConviteNominal>
export type FormularioDeLinkDaTurma = z.infer<typeof esquemaDeLinkDaTurma>
