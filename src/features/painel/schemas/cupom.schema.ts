import { z } from 'zod'
import { diaDeHoje } from '@/lib/formato'
import { inteiroEmTexto } from '@/lib/esquemas'
import type { NovoCupom } from '../types/painel.types'

/** Forma do cupom novo. O teto de 50% e a validade não passada também são conferidos na API. */
export const esquemaDeCupom = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{6,20}$/, 'Use de 6 a 20 letras, números ou hífen.'),
  percentual: inteiroEmTexto(1, 50, 'O desconto vai de 1% a 50%.'),
  valido_ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.')
    .refine((dia) => dia >= diaDeHoje(), 'A validade não pode ser no passado.'),
  limite_de_usos: inteiroEmTexto(1, 1000, 'O limite vai de 1 a 1000 turmas.'),
})

export type FormularioDeCupom = z.input<typeof esquemaDeCupom>

/** O formulário vazio: 10% para 10 turmas, válido por 30 dias. */
export const cupomEmBranco = (): FormularioDeCupom => {
  const daqui = new Date()
  daqui.setDate(daqui.getDate() + 30)

  return { codigo: '', percentual: '10', valido_ate: diaDeHoje(daqui), limite_de_usos: '10' }
}

/** O corpo da API a partir do formulário já validado. */
export const paraNovoCupom = (valores: z.output<typeof esquemaDeCupom>): NovoCupom => ({
  codigo: valores.codigo,
  percentual: Number(valores.percentual),
  valido_ate: valores.valido_ate,
  limite_de_usos: Number(valores.limite_de_usos),
})
