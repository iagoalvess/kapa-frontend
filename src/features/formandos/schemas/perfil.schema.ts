import { z } from 'zod'
import { formatarCep, formatarCpf, formatarTelefone } from '@/lib/formato'
import type { AtualizarPerfil, PerfilDoFormando } from '../types/formandos.types'

/*
  Validação de **forma**, uma seção por formulário. Nada é obrigatório — cadastro incompleto não
  bloqueia. O dígito verificador do CPF, a idade plausível e a UF existente são do backend: o erro
  volta com o campo apontado (`pessoais.cpf`), que é exatamente o nome do campo aqui — por isso
  cada seção embrulha os campos no nome dela.
*/

const soDigitos = (valor: string) => valor.replace(/\D/g, '')

const texto = (maximo: number, rotulo: string) =>
  z.string().trim().max(maximo, `${rotulo} deve ter no máximo ${maximo} caracteres.`)

const telefone = z
  .string()
  .trim()
  .refine((valor) => {
    if (valor === '') return true
    const digitos = soDigitos(valor).length
    return valor.startsWith('+') ? digitos >= 8 && digitos <= 15 : digitos === 10 || digitos === 11
  }, 'Informe DDD e número, como (41) 99876-5432.')

export const esquemaDePessoais = z.object({
  pessoais: z.object({
    nome_completo: texto(200, 'O nome completo'),
    nome_no_diploma: texto(200, 'O nome no diploma'),
    cpf: z
      .string()
      .trim()
      .refine((valor) => valor === '' || soDigitos(valor).length === 11, 'O CPF tem 11 dígitos.'),
    rg: texto(20, 'O RG'),
    matricula: texto(30, 'A matrícula'),
    telefone,
    data_de_nascimento: z.string(),
    observacoes: texto(1000, 'As observações'),
  }),
})

export const esquemaDeEndereco = z.object({
  endereco: z.object({
    cep: z
      .string()
      .trim()
      .refine((valor) => valor === '' || /^\d{2}\.?\d{3}-?\d{3}$/.test(valor), 'O CEP tem 8 dígitos.'),
    logradouro: texto(200, 'O logradouro'),
    numero: texto(20, 'O número'),
    complemento: texto(100, 'O complemento'),
    bairro: texto(100, 'O bairro'),
    cidade: texto(100, 'A cidade'),
    uf: z
      .string()
      .trim()
      .refine((valor) => valor === '' || /^[A-Za-z]{2}$/.test(valor), 'Use a sigla, como PR.'),
  }),
})

export const esquemaDeEmergencia = z.object({
  contato_de_emergencia: z.object({
    nome: texto(200, 'O nome'),
    telefone,
    parentesco: texto(50, 'O parentesco'),
  }),
})

export type FormularioDePessoais = z.infer<typeof esquemaDePessoais>
export type FormularioDeEndereco = z.infer<typeof esquemaDeEndereco>
export type FormularioDeEmergencia = z.infer<typeof esquemaDeEmergencia>

/**
 * Campo ausente na API vira `''` no `<input>`; documentos já saem com máscara.
 *
 * @param daComissao A comissão recebe o CPF mascarado e não o altera: o campo vai vazio, e a API
 *   ignora o CPF na correção. A máscara aparece fora do formulário, só para leitura.
 */
export function paraFormularios(perfil: PerfilDoFormando, daComissao = false) {
  const { pessoais: p, endereco: e, contato_de_emergencia: c } = perfil

  return {
    pessoais: {
      pessoais: {
        nome_completo: p.nome_completo ?? '',
        nome_no_diploma: p.nome_no_diploma ?? '',
        cpf: daComissao ? '' : formatarCpf(p.cpf),
        rg: p.rg ?? '',
        matricula: p.matricula ?? '',
        telefone: formatarTelefone(p.telefone),
        data_de_nascimento: p.data_de_nascimento ?? '',
        observacoes: p.observacoes ?? '',
      },
    } satisfies FormularioDePessoais,
    endereco: {
      endereco: {
        cep: formatarCep(e.cep),
        logradouro: e.logradouro ?? '',
        numero: e.numero ?? '',
        complemento: e.complemento ?? '',
        bairro: e.bairro ?? '',
        cidade: e.cidade ?? '',
        uf: e.uf ?? '',
      },
    } satisfies FormularioDeEndereco,
    emergencia: {
      contato_de_emergencia: {
        nome: c.nome ?? '',
        telefone: formatarTelefone(c.telefone),
        parentesco: c.parentesco ?? '',
      },
    } satisfies FormularioDeEmergencia,
  }
}

/**
 * Os dados que o termo de adesão exige de quem assina: nome, CPF e nascimento — este diz se a pessoa
 * pode assinar sozinha. Aqui obrigatórios, ao contrário do cadastro, que aceita incompleto.
 */
export const esquemaDoTitular = z.object({
  pessoais: z.object({
    nome_completo: texto(200, 'O nome completo').min(1, 'Informe o nome completo, como no documento.'),
    cpf: z
      .string()
      .trim()
      .refine((valor) => soDigitos(valor).length === 11, 'Informe o CPF, com 11 dígitos.'),
    data_de_nascimento: z.string().min(1, 'Informe a data de nascimento.'),
  }),
})

export type FormularioDoTitular = z.infer<typeof esquemaDoTitular>

/** O que o cadastro já tem, para o formulário do titular começar preenchido. */
export function paraFormularioDoTitular(perfil: PerfilDoFormando): FormularioDoTitular {
  const { nome_completo, cpf, data_de_nascimento } = paraFormularios(perfil).pessoais.pessoais

  return { pessoais: { nome_completo, cpf, data_de_nascimento } }
}

/**
 * O corpo da gravação: a seção pessoal inteira, com os três campos novos por cima.
 *
 * Inteira porque seção enviada é seção substituída — mandar só os três apagaria telefone, RG e
 * matrícula que a pessoa já tinha preenchido.
 */
export function comDadosDoTitular(perfil: PerfilDoFormando, titular: FormularioDoTitular): AtualizarPerfil {
  const atual = paraFormularios(perfil).pessoais.pessoais

  return { pessoais: vazioParaNulo({ ...atual, ...titular.pessoais }) }
}

/** Campo em branco vai `null`, que a API entende como "apagar". */
function vazioParaNulo<T extends Record<string, string>>(campos: T) {
  return Object.fromEntries(
    Object.entries(campos).map(([campo, valor]) => [campo, valor.trim() === '' ? null : valor.trim()]),
  ) as { [Campo in keyof T]: string | null }
}

/** Converte uma seção do formulário no corpo da API — só ela, as outras ficam como estão. */
export function paraDados(
  formulario: FormularioDePessoais | FormularioDeEndereco | FormularioDeEmergencia,
): AtualizarPerfil {
  if ('pessoais' in formulario) return { pessoais: vazioParaNulo(formulario.pessoais) }
  if ('endereco' in formulario) return { endereco: vazioParaNulo(formulario.endereco) }
  return { contato_de_emergencia: vazioParaNulo(formulario.contato_de_emergencia) }
}
