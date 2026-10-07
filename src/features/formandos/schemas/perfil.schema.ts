import { z } from 'zod'
import { formatarCpf, formatarTelefone, soDigitos } from '@/lib/formato'
import type { AtualizarPerfil, PerfilDoFormando } from '../types/formandos.types'

/*
  Validação de **forma**, uma seção por formulário. Nada é obrigatório — cadastro incompleto não
  bloqueia. O dígito verificador do CPF é do backend: o erro
  volta com o campo apontado (`pessoais.cpf`), que é exatamente o nome do campo aqui — por isso
  cada seção embrulha os campos no nome dela.
*/

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
    cpf: z
      .string()
      .trim()
      .refine((valor) => valor === '' || soDigitos(valor).length === 11, 'O CPF tem 11 dígitos.'),
    telefone,
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
export type FormularioDeEmergencia = z.infer<typeof esquemaDeEmergencia>

/**
 * Campo ausente na API vira `''` no `<input>`; documentos já saem com máscara.
 *
 * @param daComissao A comissão recebe o CPF mascarado e não o altera: o campo vai vazio, e a API
 *   ignora o CPF na correção. A máscara aparece fora do formulário, só para leitura.
 */
export function paraFormularios(perfil: PerfilDoFormando, daComissao = false) {
  const { pessoais: p, contato_de_emergencia: c } = perfil

  return {
    pessoais: {
      pessoais: {
        nome_completo: p.nome_completo ?? '',
        cpf: daComissao ? '' : formatarCpf(p.cpf),
        telefone: formatarTelefone(p.telefone),
      },
    } satisfies FormularioDePessoais,
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
 * Os dados que o termo de adesão exige de quem assina: nome e CPF. Aqui obrigatórios, ao contrário do
 * cadastro, que aceita incompleto. A idade não se pergunta: é a declaração dos Termos de Uso.
 */
export const esquemaDoTitular = z.object({
  pessoais: z.object({
    nome_completo: texto(200, 'O nome completo').min(1, 'Informe o nome completo, como no documento.'),
    cpf: z
      .string()
      .trim()
      .refine((valor) => soDigitos(valor).length === 11, 'Informe o CPF, com 11 dígitos.'),
  }),
})

export type FormularioDoTitular = z.infer<typeof esquemaDoTitular>

/** O que o cadastro já tem, para o formulário do titular começar preenchido. */
export function paraFormularioDoTitular(perfil: PerfilDoFormando): FormularioDoTitular {
  const { nome_completo, cpf } = paraFormularios(perfil).pessoais.pessoais

  return { pessoais: { nome_completo, cpf } }
}

/**
 * O corpo da gravação: a seção pessoal inteira, com nome e CPF novos por cima.
 *
 * Inteira porque seção enviada é seção substituída — mandar só os dois apagaria o telefone que a
 * pessoa já tinha preenchido.
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
export function paraDados(formulario: FormularioDePessoais | FormularioDeEmergencia): AtualizarPerfil {
  if ('pessoais' in formulario) return { pessoais: vazioParaNulo(formulario.pessoais) }
  return { contato_de_emergencia: vazioParaNulo(formulario.contato_de_emergencia) }
}
