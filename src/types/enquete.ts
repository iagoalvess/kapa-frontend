/** A consulta da turma, com resultado agregado e somente a resposta do próprio titular. */
export interface EnqueteResumo {
  id: string
  pergunta: string
  descricao: string | null
  tipo: 'UnicaEscolha' | 'MultiplaEscolha'
  maximo_de_escolhas: number | null
  quorum_minimo_percentual: number
  total_aptos: number
  total_respostas: number
  quorum_atingido: boolean
  situacao: 'Aberta' | 'Encerrada' | 'Cancelada'
  criado_em: string
  encerra_em: string
  encerrada_em: string | null
  cancelada_em: string | null
  opcoes_travadas: boolean
  minha_resposta: string[] | null
  pode_responder: boolean
  motivo_do_bloqueio: string | null
}

/** Alternativa com contagem por pessoa; a múltipla pode somar mais de 100%. */
export interface OpcaoComResultado {
  id: string
  texto: string
  ordem: number
  respostas: number
  percentual: number
}

/** Nomes de participantes chegam apenas para a Gestão, sem associação às escolhas. */
export interface EnqueteDetalhe {
  enquete: EnqueteResumo
  opcoes: OpcaoComResultado[]
  participantes: { nome: string }[] | null
}

/** Cadastro enviado em snake_case; sigilo e resultado ao vivo são regras fixas. */
export interface DadosDaEnquete {
  pergunta: string
  descricao: string | null
  tipo: EnqueteResumo['tipo']
  maximo_de_escolhas: number | null
  quorum_minimo_percentual: number
  encerra_em: string
  opcoes: string[]
}
