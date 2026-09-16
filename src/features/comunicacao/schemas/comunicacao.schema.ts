import { z } from 'zod'
import {
  type Aviso,
  type CategoriaDeDocumento,
  type DadosDoAviso,
  type DadosDoDocumento,
  type Documento,
  ROTULOS_DE_CATEGORIA,
  ROTULOS_DE_VISIBILIDADE,
  type Visibilidade,
} from '../types/comunicacao.types'

/*
  Validação de **forma**. O limite de fixados volta da API (`comunicacao.limite_de_fixados`), e o
  tipo do arquivo pelos primeiros bytes também (`comunicacao.conteudo_invalido`), com a mensagem
  pronta.

  Visibilidade começa vazia ("Escolha") de propósito: "a turma toda" como padrão publicaria para
  todo mundo a ata interna que a comissão esqueceu de marcar. É escolha, toda vez — como o ano e o
  semestre da formatura, o valor do combo é texto e a lista fechada é conferida aqui.
*/

const umaDas = (valores: object, mensagem: string) =>
  z.string().refine((valor) => Object.keys(valores).includes(valor), mensagem)

const visibilidade = umaDas(ROTULOS_DE_VISIBILIDADE, 'Escolha para quem é.')

const titulo = z.string().trim().min(1, 'Informe o título.').max(150, 'No máximo 150 caracteres.')

export const esquemaDoAviso = z.object({
  titulo,
  conteudo: z.string().trim().min(1, 'Escreva o texto do aviso.').max(20_000, 'No máximo 20.000 caracteres.'),
  visibilidade,
  fixado: z.boolean(),
  destaque: z.boolean(),
})

export type FormularioDoAviso = z.infer<typeof esquemaDoAviso>

/** O aviso em branco — ou o que está sendo corrigido. Visibilidade vazia até alguém escolher. */
export const paraFormularioDoAviso = (aviso?: Aviso): FormularioDoAviso => ({
  titulo: aviso?.titulo ?? '',
  conteudo: aviso?.conteudo ?? '',
  visibilidade: aviso?.visibilidade ?? '',
  fixado: aviso?.fixado ?? false,
  destaque: aviso?.destaque ?? false,
})

/** O formulário já validado, como a API espera. */
export const paraDadosDoAviso = (valores: FormularioDoAviso): DadosDoAviso => ({
  ...valores,
  visibilidade: valores.visibilidade as Visibilidade,
})

export const esquemaDoDocumento = z.object({
  titulo,
  categoria: umaDas(ROTULOS_DE_CATEGORIA, 'Escolha a categoria.'),
  visibilidade,
})

export type FormularioDoDocumento = z.infer<typeof esquemaDoDocumento>

/**
 * O documento em branco — ou o que está sendo corrigido.
 *
 * @param categoria A da coluna do quadro onde se clicou "+ Adicionar"; sem ela, "Escolha".
 */
export const paraFormularioDoDocumento = (
  documento?: Documento,
  categoria?: CategoriaDeDocumento,
): FormularioDoDocumento => ({
  titulo: documento?.titulo ?? '',
  categoria: documento?.categoria ?? categoria ?? '',
  visibilidade: documento?.visibilidade ?? '',
})

/** O formulário já validado, como a API espera. */
export const paraDadosDoDocumento = (valores: FormularioDoDocumento): DadosDoDocumento => ({
  titulo: valores.titulo,
  categoria: valores.categoria as CategoriaDeDocumento,
  visibilidade: valores.visibilidade as Visibilidade,
})
