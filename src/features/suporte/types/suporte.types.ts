/** Uma turma na lista de resultados da busca. Espelha `TurmaEncontradaDTO`. */
export interface TurmaEncontrada {
  id: string
  nome: string
  instituicao: string
  curso: string
  status: string
  membros: number
}

/** Uma conta na lista de resultados da busca. Espelha `UsuarioEncontradoDTO`. */
export interface UsuarioEncontrado {
  id: string
  nome: string
  email: string
  ativo: boolean
  turmas: number
}

/** O que a busca do painel encontrou. Espelha `ResultadoDaBuscaDTO`. */
export interface ResultadoDaBusca {
  turmas: TurmaEncontrada[]
  usuarios: UsuarioEncontrado[]
}

/** A licença da turma, como o suporte a vê. Espelha `AssinaturaNoSuporteDTO`. */
export interface AssinaturaNoSuporte {
  id: string
  plano_nome: string
  plano_codigo: string
  limite_de_formandos: number
  status: string
  vigente_ate: string | null
  cancelada_em: string | null
  contratada_em: string
}

/**
 * Um membro da turma, como o suporte o vê. Espelha `MembroNoSuporteDTO`.
 *
 * O CPF chega **mascarado** da API (`***.982.247-**`). Não existe endpoint no painel que devolva o
 * número inteiro — quem atende não precisa dele para dizer por que o pagamento não entrou.
 */
export interface MembroNoSuporte {
  usuario_id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  desligado_em: string | null
  cpf: string | null
}

/** A turma inteira, como o suporte a vê. Espelha `TurmaNoSuporteDTO`. */
export interface TurmaNoSuporte {
  id: string
  nome: string
  instituicao: string
  curso: string
  ano: number
  semestre: number
  status: string
  criada_em: string
  ativada_em: string | null
  assinatura: AssinaturaNoSuporte | null
  membros: MembroNoSuporte[]
  parcelas: number
  parcelas_pagas: number
  adesoes: number
}

/** Uma turma de que a pessoa participa. Espelha `VinculoNoSuporteDTO`. */
export interface VinculoNoSuporte {
  formatura_id: string
  nome: string
  instituicao: string
  status: string
  papel: string
  ativo: boolean
  desligado_em: string | null
}

/** A conta inteira, como o suporte a vê. Espelha `UsuarioNoSuporteDTO`. */
export interface UsuarioNoSuporte {
  id: string
  nome: string
  email: string
  email_confirmado: boolean
  ativo: boolean
  bloqueado_ate: string | null
  tentativas_falhas: number
  perfis: string[]
  anonimizado_em: string | null
  criado_em: string
  vinculos: VinculoNoSuporte[]
}

/** As ações que o painel executa sobre uma conta. O caminho é o próprio nome no backend. */
export type AcaoNaConta = 'reenviar-confirmacao' | 'redefinir-senha' | 'desbloquear'
