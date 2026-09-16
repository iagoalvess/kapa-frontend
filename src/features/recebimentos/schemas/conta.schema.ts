import { z } from 'zod'
import { formatarCnpj, formatarCpf, formatarTelefone } from '@/lib/formato'
import type { ContaDeRecebimento, DadosDaConta, TipoDeChavePix } from '../types/recebimentos.types'

const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/**
 * O que a tela precisa de cada tipo de chave: o nome, um exemplo e a conferência de forma.
 *
 * A conferência aqui é só o tamanho e o desenho — dígito verificador do CPF e do CNPJ, e o celular
 * brasileiro com o 9, são do backend, e o erro volta no campo `chave`. As mensagens repetem as dele
 * para a pessoa ler a mesma coisa venha de onde vier.
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

/** Chave, titular e cidade. Os limites de tamanho são os do backend (`ContaDeRecebimentoValidator`). */
export const esquemaDaConta = z
  .object({
    tipo_de_chave: z.enum(['Cpf', 'Cnpj', 'Email', 'Telefone', 'Aleatoria']),
    chave: z.string().trim().min(1, 'Informe a chave PIX.'),
    nome_do_titular: z
      .string()
      .trim()
      .min(1, 'Informe o nome do titular, como o banco mostra.')
      .max(200, 'O nome deve ter no máximo 200 caracteres.'),
    cidade: z
      .string()
      .trim()
      .min(1, 'Informe a cidade do titular.')
      .max(100, 'A cidade deve ter no máximo 100 caracteres.'),
  })
  .superRefine(({ tipo_de_chave, chave }, contexto) => {
    const tipo = TIPOS_DE_CHAVE[tipo_de_chave]
    if (chave && !tipo.valida(chave))
      contexto.addIssue({ code: 'custom', path: ['chave'], message: tipo.motivo })
  })

export type FormularioDaConta = z.infer<typeof esquemaDaConta>

/** A chave para gente ler: CPF, CNPJ e celular com máscara; e-mail e aleatória como vieram. */
export function chaveParaExibir(tipo: TipoDeChavePix, chave: string) {
  if (tipo === 'Cpf') return formatarCpf(chave)
  if (tipo === 'Cnpj') return formatarCnpj(chave)
  if (tipo === 'Telefone') return formatarTelefone(chave)
  return chave
}

/** O formulário vazio, ou com a conta atual para a troca partir dela. */
export function paraFormularioDaConta(conta?: ContaDeRecebimento): DadosDaConta {
  return conta
    ? {
        tipo_de_chave: conta.tipo_de_chave,
        chave: chaveParaExibir(conta.tipo_de_chave, conta.chave),
        nome_do_titular: conta.nome_do_titular,
        cidade: conta.cidade,
      }
    : { tipo_de_chave: 'Cpf', chave: '', nome_do_titular: '', cidade: '' }
}
