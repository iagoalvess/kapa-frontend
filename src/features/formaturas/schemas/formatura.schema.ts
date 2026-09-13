import { z } from 'zod'
import type { DadosDaFormatura } from '../types/formaturas.types'

/*
  Validação de **forma**. Os números viajam como texto no formulário — é o que `<input>` e
  `<select>` entregam — e viram número só em `paraDados`. "Você já tem um rascunho" e as
  transições de status são do backend.
*/

const texto = (rotulo: string) =>
  z
    .string()
    .trim()
    .min(1, `${rotulo} é obrigatório.`)
    .max(120, `${rotulo} deve ter no máximo 120 caracteres.`)

const inteiro = (mensagem: string, minimo: number, maximo: number) =>
  z.string().refine((valor) => {
    const numero = Number(valor)
    return valor.trim() !== '' && Number.isInteger(numero) && numero >= minimo && numero <= maximo
  }, mensagem)

/** Dados cadastrais da formatura, os mesmos na criação e na edição. */
export const esquemaDeFormatura = z.object({
  curso: texto('O curso'),
  instituicao: texto('A instituição'),
  ano: z.string().min(1, 'Escolha o ano.'),
  semestre: z.string().refine((valor) => ['1', '2'].includes(valor), 'Escolha o semestre.'),
  previsaoDeColacao: z.string(),
  quantidadeEstimadaDeFormandos: inteiro('Informe um número entre 1 e 2000.', 1, 2000),
  nome: z
    .string()
    .trim()
    .min(3, 'O nome deve ter ao menos 3 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
})

export type FormularioDeFormatura = z.infer<typeof esquemaDeFormatura>

/** Anos aceitos para a conclusão: o corrente e os oito seguintes, como no backend. */
export function anosDeConclusao(hoje = new Date()) {
  const corrente = hoje.getFullYear()
  return Array.from({ length: 9 }, (_, i) => corrente + i)
}

/**
 * Nome sugerido a partir da turma: "Medicina 2027.1 — UFPR".
 *
 * Só sugestão: a comissão edita no último passo, e a sugestão não sobrescreve o que ela escreveu.
 */
export function sugerirNome({ curso, ano, semestre, instituicao }: FormularioDeFormatura) {
  return `${curso.trim()} ${ano}.${semestre} — ${instituicao.trim()}`
}

/** Converte o formulário no corpo da API. */
export function paraDados(formulario: FormularioDeFormatura): DadosDaFormatura {
  return {
    nome: formulario.nome.trim(),
    curso: formulario.curso.trim(),
    instituicao: formulario.instituicao.trim(),
    ano: Number(formulario.ano),
    semestre: Number(formulario.semestre),
    previsaoDeColacao: formulario.previsaoDeColacao || null,
    quantidadeEstimadaDeFormandos: Number(formulario.quantidadeEstimadaDeFormandos),
  }
}
