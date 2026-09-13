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
    nomeCompleto: texto(200, 'O nome completo'),
    nomeNoDiploma: texto(200, 'O nome no diploma'),
    cpf: z
      .string()
      .trim()
      .refine((valor) => valor === '' || soDigitos(valor).length === 11, 'O CPF tem 11 dígitos.'),
    rg: texto(20, 'O RG'),
    matricula: texto(30, 'A matrícula'),
    telefone,
    dataDeNascimento: z.string(),
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
  contatoDeEmergencia: z.object({
    nome: texto(200, 'O nome'),
    telefone,
    parentesco: texto(50, 'O parentesco'),
  }),
})

export type FormularioDePessoais = z.infer<typeof esquemaDePessoais>
export type FormularioDeEndereco = z.infer<typeof esquemaDeEndereco>
export type FormularioDeEmergencia = z.infer<typeof esquemaDeEmergencia>

/** Campo ausente na API vira `''` no `<input>`; documentos já saem com máscara. */
export function paraFormularios(perfil: PerfilDoFormando) {
  const { pessoais: p, endereco: e, contatoDeEmergencia: c } = perfil

  return {
    pessoais: {
      pessoais: {
        nomeCompleto: p.nomeCompleto ?? '',
        nomeNoDiploma: p.nomeNoDiploma ?? '',
        cpf: formatarCpf(p.cpf),
        rg: p.rg ?? '',
        matricula: p.matricula ?? '',
        telefone: formatarTelefone(p.telefone),
        dataDeNascimento: p.dataDeNascimento ?? '',
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
      contatoDeEmergencia: {
        nome: c.nome ?? '',
        telefone: formatarTelefone(c.telefone),
        parentesco: c.parentesco ?? '',
      },
    } satisfies FormularioDeEmergencia,
  }
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
  return { contatoDeEmergencia: vazioParaNulo(formulario.contatoDeEmergencia) }
}
