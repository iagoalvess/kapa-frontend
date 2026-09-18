/**
 * O que o formulário de contato envia. Espelha `NovoLeadRequestDTO`.
 *
 * `sobrenome` é o honeypot: fica escondido por CSS e nenhuma pessoa o enxerga. A API descarta o
 * envio que vier com ele preenchido — e responde sucesso, para o robô não aprender nada.
 */
export interface NovoLead {
  nome: string
  email: string
  telefone: string
  instituicao: string
  curso: string
  tamanho_da_turma: number
  previsao_de_colacao: string
  mensagem: string
  aceita_privacidade: boolean
  origem: string
  meio: string
  campanha: string
  sobrenome: string
}
