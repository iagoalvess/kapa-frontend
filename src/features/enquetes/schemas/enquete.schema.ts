import { z } from 'zod'
import type { DadosDaEnquete, EnqueteDetalhe } from '@/types/enquete'

/** Limites do cadastro em acordo com a validação de domínio. */
export const esquemaDeEnquete = z
  .object({
    pergunta: z.string().trim().min(1, 'Informe a pergunta.').max(200),
    descricao: z.string().max(2000),
    tipo: z.enum(['UnicaEscolha', 'MultiplaEscolha']),
    maximo_de_escolhas: z.number().int().min(1).max(10),
    quorum_minimo_percentual: z.number().int().min(1, 'Informe de 1% a 100%.').max(100),
    encerra_em: z.string().min(1, 'Informe o prazo.'),
    opcoes: z
      .array(z.object({ texto: z.string().trim().min(1, 'Informe a opção.').max(120) }))
      .min(2)
      .max(10),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipo === 'MultiplaEscolha' && dados.maximo_de_escolhas > dados.opcoes.length)
      contexto.addIssue({
        code: 'custom',
        path: ['maximo_de_escolhas'],
        message: 'O limite não pode superar a quantidade de opções.',
      })
    if (new Set(dados.opcoes.map((o) => o.texto.toLocaleLowerCase('pt-BR'))).size !== dados.opcoes.length)
      contexto.addIssue({ code: 'custom', path: ['opcoes'], message: 'As opções devem ser diferentes.' })
    if (!Number.isFinite(new Date(dados.encerra_em).getTime()))
      contexto.addIssue({ code: 'custom', path: ['encerra_em'], message: 'Informe uma data e hora válidas.' })
  })

export type ValoresDaEnquete = z.infer<typeof esquemaDeEnquete>

/** Converte o instante UTC para o campo nativo no fuso do navegador. */
export function instanteLocal(instante: string) {
  const data = new Date(instante)
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** O cadastro existente conserva a ordem das alternativas. */
export function paraFormularioDaEnquete(detalhe?: EnqueteDetalhe): ValoresDaEnquete {
  const enquete = detalhe?.enquete
  return {
    pergunta: enquete?.pergunta ?? '',
    descricao: enquete?.descricao ?? '',
    tipo: enquete?.tipo ?? 'UnicaEscolha',
    maximo_de_escolhas: enquete?.maximo_de_escolhas ?? 1,
    quorum_minimo_percentual: enquete?.quorum_minimo_percentual ?? 50,
    encerra_em: instanteLocal(enquete?.encerra_em ?? new Date(Date.now() + 24 * 60 * 60_000).toISOString()),
    opcoes: detalhe?.opcoes.map((o) => ({ texto: o.texto })) ?? [{ texto: '' }, { texto: '' }],
  }
}

/** O campo local vira UTC uma vez, na borda de envio. */
export function paraDadosDaEnquete(valores: ValoresDaEnquete): DadosDaEnquete {
  return {
    ...valores,
    descricao: valores.descricao.trim() || null,
    maximo_de_escolhas: valores.tipo === 'MultiplaEscolha' ? valores.maximo_de_escolhas : null,
    encerra_em: new Date(valores.encerra_em).toISOString(),
    opcoes: valores.opcoes.map((o) => o.texto),
  }
}
