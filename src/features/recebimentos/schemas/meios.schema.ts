import { z } from 'zod'
import { formatarCnpj, formatarCpf, formatarTelefone } from '@/lib/formato'
import type { ContaDeRecebimento, MeiosDaConta, TipoDeChavePix } from '../types/recebimentos.types'

export { MEIOS } from '@/types/recebimento'

const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/**
 * O que a tela precisa de cada tipo de chave: o nome, um exemplo e a conferência de forma.
 *
 * A conferência aqui é só o tamanho e o desenho — dígito verificador do CPF e do CNPJ, e o celular
 * brasileiro com o 9, são do backend, e o erro volta no campo `pix.chave`. As mensagens repetem as
 * dele para a pessoa ler a mesma coisa venha de onde vier.
 */
export const TIPOS_DE_CHAVE: Record<
  TipoDeChavePix,
  {
    rotulo: string
    exemplo: string
    teclado: 'numeric' | 'email' | 'tel' | 'text'
    valida: (chave: string) => boolean
    motivo: string
  }
> = {
  Cpf: {
    rotulo: 'CPF',
    exemplo: '529.982.247-25',
    teclado: 'numeric',
    valida: (chave) => soDigitos(chave).length === 11,
    motivo: 'CPF inválido: confira os 11 dígitos.',
  },
  Cnpj: {
    rotulo: 'CNPJ',
    exemplo: '11.222.333/0001-81',
    teclado: 'text',
    valida: (chave) => chave.replace(/[^0-9a-z]/gi, '').length === 14,
    motivo: 'CNPJ inválido: confira os 14 caracteres.',
  },
  Email: {
    rotulo: 'E-mail',
    exemplo: 'tesouraria@turma.com.br',
    teclado: 'email',
    valida: (chave) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave),
    motivo: 'E-mail inválido.',
  },
  Telefone: {
    rotulo: 'Celular',
    exemplo: '(41) 99876-5432',
    teclado: 'tel',
    valida: (chave) => soDigitos(chave).replace(/^55(?=\d{11}$)/, '').length === 11,
    motivo: 'Informe o celular com DDD, como (41) 99876-5432.',
  },
  Aleatoria: {
    rotulo: 'Chave aleatória',
    exemplo: '123e4567-e89b-12d3-a456-426614174000',
    teclado: 'text',
    valida: (chave) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave),
    motivo: 'A chave aleatória tem o formato 123e4567-e89b-12d3-a456-426614174000.',
  },
}

const TAMANHO_DO_CAMPO = 100

/** Os campos do TED, cada um com a mensagem de vazio e o rótulo da mensagem de tamanho. */
const CAMPOS_BANCARIOS = [
  ['banco', 'Informe o banco.', 'O banco'],
  ['agencia', 'Informe a agência.', 'A agência'],
  ['conta', 'Informe a conta, com o dígito.', 'A conta'],
  ['tipo_de_conta', 'Informe o tipo da conta.', 'O tipo da conta'],
  ['titular', 'Informe o titular da conta.', 'O titular'],
] as const

/**
 * Os três meios num formulário só: um interruptor por meio e os campos dele ao lado.
 *
 * Os campos existem sempre, e são conferidos só quando o meio está ligado — desligar um meio não
 * pode acender o erro do campo que ninguém vai preencher. Os caminhos (`pix.chave`,
 * `transferencia.banco`) são os mesmos que o backend devolve em `errors`, então o erro do servidor
 * cai embaixo do campo certo sem tradução.
 *
 * Os limites de tamanho são os do `ContaDeRecebimentoValidator`.
 */
export const esquemaDosMeios = z
  .object({
    pix_ativo: z.boolean(),
    pix: z.object({
      tipo_de_chave: z.enum(['Cpf', 'Cnpj', 'Email', 'Telefone', 'Aleatoria']),
      chave: z.string(),
      nome_do_titular: z.string(),
      cidade: z.string(),
    }),
    transferencia_ativo: z.boolean(),
    transferencia: z.object({
      banco: z.string(),
      agencia: z.string(),
      conta: z.string(),
      tipo_de_conta: z.string(),
      titular: z.string(),
    }),
    dinheiro_ativo: z.boolean(),
    dinheiro: z.object({ nome: z.string(), onde: z.string() }),
  })
  .superRefine((valores, contexto) => {
    const adicionar = (path: (string | number)[], message: string) =>
      contexto.addIssue({ code: 'custom', path, message })

    if (valores.pix_ativo) {
      const tipo = TIPOS_DE_CHAVE[valores.pix.tipo_de_chave]
      const chave = valores.pix.chave.trim()

      if (!chave) adicionar(['pix', 'chave'], 'Informe a chave PIX.')
      else if (!tipo.valida(chave)) adicionar(['pix', 'chave'], tipo.motivo)

      if (!valores.pix.nome_do_titular.trim())
        adicionar(['pix', 'nome_do_titular'], 'Informe o nome do titular, como o banco mostra.')
      else if (valores.pix.nome_do_titular.trim().length > 200)
        adicionar(['pix', 'nome_do_titular'], 'O nome deve ter no máximo 200 caracteres.')

      if (!valores.pix.cidade.trim()) adicionar(['pix', 'cidade'], 'Informe a cidade do titular.')
      else if (valores.pix.cidade.trim().length > 100)
        adicionar(['pix', 'cidade'], 'A cidade deve ter no máximo 100 caracteres.')
    }

    if (valores.transferencia_ativo)
      for (const [campo, ausente, rotulo] of CAMPOS_BANCARIOS) {
        const valor = valores.transferencia[campo].trim()

        if (!valor) adicionar(['transferencia', campo], ausente)
        else if (valor.length > TAMANHO_DO_CAMPO)
          adicionar(['transferencia', campo], `${rotulo} deve ter no máximo ${TAMANHO_DO_CAMPO} caracteres.`)
      }

    if (valores.dinheiro_ativo) {
      const nome = valores.dinheiro.nome.trim()

      if (!nome) adicionar(['dinheiro', 'nome'], 'Informe com quem o formando fala para pagar em dinheiro.')
      else if (nome.length > TAMANHO_DO_CAMPO)
        adicionar(['dinheiro', 'nome'], `O nome deve ter no máximo ${TAMANHO_DO_CAMPO} caracteres.`)

      if (valores.dinheiro.onde.trim().length > TAMANHO_DO_CAMPO)
        adicionar(['dinheiro', 'onde'], `O local deve ter no máximo ${TAMANHO_DO_CAMPO} caracteres.`)
    }
  })

export type FormularioDosMeios = z.infer<typeof esquemaDosMeios>

/**
 * A turma não marcou meio nenhum — a única regra que não cabe no schema.
 *
 * Erro de formulário inteiro mora em `errors.root`, e o React Hook Form reserva `root` para o
 * `setError`: uma issue do Zod nesse caminho é descartada antes de chegar ao `formState`. Por isso a
 * regra é uma função, chamada no envio, e testada aqui do mesmo jeito.
 *
 * @param valores Valores do formulário.
 */
export const nenhumMeioMarcado = (valores: FormularioDosMeios) =>
  !valores.pix_ativo && !valores.transferencia_ativo && !valores.dinheiro_ativo

/** A mensagem de "nenhum meio", a mesma que o backend devolve em `recebimento.sem_meio`. */
export const SEM_MEIO = 'Escolha ao menos um meio de recebimento para a turma.'

/** O corpo do `PUT`: meio desligado vai `null`, que é como o backend lê "a turma não aceita". */
export function paraMeios(valores: FormularioDosMeios): MeiosDaConta {
  return {
    pix: valores.pix_ativo ? valores.pix : null,
    transferencia: valores.transferencia_ativo ? valores.transferencia : null,
    dinheiro: valores.dinheiro_ativo
      ? { nome: valores.dinheiro.nome, onde: valores.dinheiro.onde.trim() || null }
      : null,
  }
}

/** A chave para gente ler: CPF, CNPJ e celular com máscara; e-mail e aleatória como vieram. */
export function chaveParaExibir(tipo: TipoDeChavePix, chave: string) {
  if (tipo === 'Cpf') return formatarCpf(chave)
  if (tipo === 'Cnpj') return formatarCnpj(chave)
  if (tipo === 'Telefone') return formatarTelefone(chave)
  return chave
}

/**
 * O formulário vazio, ou com os meios atuais para a edição partir deles.
 *
 * Meio desligado vem com os campos vazios e o interruptor baixado; ligar de novo começa do zero, e
 * não do que estava gravado antes — o dado foi apagado no `PUT` que o desligou.
 */
export function paraFormularioDosMeios(conta?: ContaDeRecebimento | null): FormularioDosMeios {
  const meios = conta?.meios

  return {
    // A primeira gravação da turma abre com o PIX ligado: é o meio que quase toda turma usa, e
    // deixá-lo desligado faria o formulário nascer sem campo nenhum à vista.
    pix_ativo: !meios || Boolean(meios.pix),
    pix: meios?.pix
      ? {
          tipo_de_chave: meios.pix.tipo_de_chave,
          chave: chaveParaExibir(meios.pix.tipo_de_chave, meios.pix.chave),
          nome_do_titular: meios.pix.nome_do_titular,
          cidade: meios.pix.cidade,
        }
      : { tipo_de_chave: 'Cpf', chave: '', nome_do_titular: '', cidade: '' },
    transferencia_ativo: Boolean(meios?.transferencia),
    transferencia: meios?.transferencia ?? {
      banco: '',
      agencia: '',
      conta: '',
      tipo_de_conta: 'Corrente',
      titular: '',
    },
    dinheiro_ativo: Boolean(meios?.dinheiro),
    dinheiro: { nome: meios?.dinheiro?.nome ?? '', onde: meios?.dinheiro?.onde ?? '' },
  }
}
