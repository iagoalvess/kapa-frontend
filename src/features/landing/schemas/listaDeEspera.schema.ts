import { z } from 'zod'

/*
  A inscrição na lista de espera (Sprint 36, P1). É o único schema do projeto que vale nos dois lados:
  o formulário do site e a Pages Function (`functions/api/lista-de-espera.ts`), que não tem outro
  backend por trás. Por isso só importa o `zod` — nada de `@/`, que o bundler do Worker não resolve.
*/

/** A versão do aviso de privacidade publicada. Mudou o texto do aviso, sobe aqui: a inscrição grava esta. */
export const AVISO_DA_LISTA_DE_ESPERA = { versao: 1, publicadoEm: '28/09/2026' } as const

/** O papel de quem se inscreve. Formando entra também (P4): a conversa prioriza a comissão. */
export const PAPEIS_NA_TURMA = {
  presidente: 'Presidente da comissão',
  comissao: 'Comissão',
  formando: 'Formando',
  outro: 'Outro',
} as const

/** O tamanho da turma, em faixas (P1). */
export const TAMANHOS_DA_TURMA = {
  ate_50: 'Até 50 formandos',
  de_51_a_100: '51 a 100',
  de_101_a_200: '101 a 200',
  mais_de_200: 'Mais de 200',
} as const

/** `Object.hasOwn`, e não `in`: `toString` passaria pela guarda (a mesma razão do `ehOpcao`). */
const umaDas = (mapa: object, mensagem: string) =>
  z.string(mensagem).refine((valor) => Object.hasOwn(mapa, valor), mensagem)

const texto = (mensagem: string, maximo: number) => z.string(mensagem).trim().min(1, mensagem).max(maximo)

/** O WhatsApp só com os números: DDD + 8 ou 9 dígitos. */
export const soNumeros = (valor: string) => valor.replaceAll(/\D/g, '')

export const esquemaDaInscricao = z.object({
  nome: texto('Informe o seu nome.', 120),
  email: z
    .string('Informe um e-mail válido.')
    .trim()
    .toLowerCase()
    .max(254)
    .email('Informe um e-mail válido.'),
  instituicao: texto('Informe a instituição.', 120),
  curso: texto('Informe o curso.', 120),
  /** `2027.2` — ano e semestre, como a turma se chama ("formandos 2027.2"). */
  semestre_de_formatura: z
    .string('Escolha quando a turma se forma.')
    .regex(/^20\d{2}\.[12]$/, 'Escolha quando a turma se forma.'),
  papel: umaDas(PAPEIS_NA_TURMA, 'Escolha o seu papel na turma.'),
  tamanho_da_turma: umaDas(TAMANHOS_DA_TURMA, 'Escolha o tamanho da turma.'),
  whatsapp: z
    .string('Informe o WhatsApp com DDD.')
    .trim()
    .refine((valor) => valor === '' || /^\d{10,11}$/.test(soNumeros(valor)), 'Informe o WhatsApp com DDD.'),
  aceite: z
    .boolean('Confirme que leu o aviso de privacidade.')
    .refine(Boolean, 'Confirme que leu o aviso de privacidade.'),
})

export type FormularioDaInscricao = z.infer<typeof esquemaDaInscricao>

export const inscricaoEmBranco: FormularioDaInscricao = {
  nome: '',
  email: '',
  instituicao: '',
  curso: '',
  semestre_de_formatura: '',
  papel: '',
  tamanho_da_turma: '',
  whatsapp: '',
  aceite: false,
}

/**
 * Os semestres oferecidos no formulário: deste ano até seis à frente — a comissão se forma em até
 * cinco anos, e medicina em seis.
 *
 * @param hoje A data de referência.
 */
export function semestresDeFormatura(hoje = new Date()) {
  const ano = hoje.getFullYear()
  return Array.from({ length: 7 }, (_, indice) => ano + indice).flatMap((cada) => [
    { valor: `${cada}.1`, rotulo: `1º semestre de ${cada}` },
    { valor: `${cada}.2`, rotulo: `2º semestre de ${cada}` },
  ])
}
