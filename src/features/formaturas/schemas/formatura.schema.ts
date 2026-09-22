import { z } from 'zod'
import type { DadosDoEvento } from '@/types/agenda'
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
  previsao_de_colacao: z.string(),
  previsao_da_festa: z.string(),
  quantidade_estimada_de_formandos: inteiro('Informe o número de formandos.', 1, 2000),
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
 * Nome sugerido a partir da turma: "Medicina 2027". Semestre e instituição ficam de fora — já são
 * campos próprios, e repeti-los no nome só o alonga.
 *
 * Só sugestão: a comissão edita no último passo, e a sugestão não sobrescreve o que ela escreveu.
 */
export function sugerirNome({ curso, ano }: FormularioDeFormatura) {
  return `${curso.trim()} ${ano}`
}

/**
 * Converte o formulário no corpo da API.
 *
 * Sem as duas datas: desde a Sprint 19 elas são eventos da agenda, e vão num `POST /agenda` logo
 * depois — ver {@link paraEventosIniciais}. O cadastro da turma não as guarda mais.
 */
export function paraDados(formulario: FormularioDeFormatura): DadosDaFormatura {
  return {
    nome: formulario.nome.trim(),
    curso: formulario.curso.trim(),
    instituicao: formulario.instituicao.trim(),
    ano: Number(formulario.ano),
    semestre: Number(formulario.semestre),
    quantidade_estimada_de_formandos: Number(formulario.quantidade_estimada_de_formandos),
  }
}

/**
 * As datas que o wizard perguntou, como eventos da agenda — nenhuma, uma ou duas.
 *
 * O wizard continua perguntando a colação e a festa porque é o momento em que a comissão as tem na
 * cabeça; o que mudou é onde elas caem. Elas não podem ir no mesmo `POST` da formatura: o
 * isolamento por turma carimba a linha com a formatura **da sessão**, e no momento em que a turma
 * nasce a sessão ainda é a de antes dela. Só depois de o token novo entrar é que existe turma para
 * a agenda pertencer.
 *
 * Nascem `AConfirmar`: é o que o campo dizia — "previsão".
 *
 * @param formulario O formulário preenchido.
 */
export function paraEventosIniciais(formulario: FormularioDeFormatura): DadosDoEvento[] {
  const eventos: DadosDoEvento[] = []

  if (formulario.previsao_de_colacao)
    eventos.push({
      titulo: 'Colação de grau',
      tipo: 'Colacao',
      situacao: 'AConfirmar',
      data: formulario.previsao_de_colacao,
    })

  if (formulario.previsao_da_festa)
    eventos.push({
      titulo: 'Festa de formatura',
      tipo: 'Festa',
      situacao: 'AConfirmar',
      data: formulario.previsao_da_festa,
    })

  return eventos
}
