import { z } from 'zod'
import { PAPEIS } from '@/config/perfis'

/*
  Validação de **forma**. Quem pode oferecer papel de comissão é o backend quem decide
  (`convite.papel_restrito`) — a tela só esconde a escolha de quem não é Presidente.
*/

/** Convite nominal: um e-mail, um uso. */
export const esquemaDeConviteNominal = z.object({
  email: z.email('Informe um e-mail válido.'),
  papel: z.enum(Object.values(PAPEIS)),
})

export type FormularioDeConviteNominal = z.infer<typeof esquemaDeConviteNominal>
