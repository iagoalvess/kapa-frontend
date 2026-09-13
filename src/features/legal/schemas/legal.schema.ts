import { z } from 'zod'
import type { TipoDeDocumento } from '@/config/legal'

/** `true` literal: `z.boolean()` aceitaria `false` e deixaria o aceite passar desmarcado. */
const aceite = z.literal(true, 'É preciso aceitar para continuar.')

/**
 * Re-aceite das versões pendentes: um checkbox obrigatório por documento.
 *
 * Montado a partir das pendências porque quem já aceitou a Política vigente só precisa aceitar
 * os Termos novos, e vice-versa.
 *
 * @param pendentes Documentos que precisam de aceite.
 */
export function esquemaDeReaceite(pendentes: readonly TipoDeDocumento[]) {
  return z.object({
    aceites: z.object(
      Object.fromEntries(pendentes.map((tipo) => [tipo, aceite])) as Record<TipoDeDocumento, typeof aceite>,
    ),
  })
}

export type FormularioDeReaceite = z.infer<ReturnType<typeof esquemaDeReaceite>>
