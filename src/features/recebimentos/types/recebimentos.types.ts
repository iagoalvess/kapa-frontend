import type { DadosBancarios } from '@/types/recebimento'

export type { DadosBancarios, MeioDeRecebimento } from '@/types/recebimento'

export type TipoDeChavePix = 'Cpf' | 'Cnpj' | 'Email' | 'Telefone' | 'Aleatoria'

/** A chave PIX da turma. Espelha `ChavePixDTO`. */
export interface ChavePix {
  tipo_de_chave: TipoDeChavePix
  /** Na volta, no formato do diretório do PIX: CPF só dígitos, celular em `+55…`. */
  chave: string
  nome_do_titular: string
  cidade: string
}

/** Com quem o formando fala para pagar em espécie. Espelha `DinheiroDTO`. */
interface DinheiroCom {
  nome: string
  onde: string | null
}

/** Os meios que a turma aceita. Meio nulo é meio desligado. Espelha `MeiosDaContaDTO`. */
export interface MeiosDaConta {
  pix: ChavePix | null
  transferencia: DadosBancarios | null
  dinheiro: DinheiroCom | null
}

/** A conta de recebimento gravada. Espelha `ContaDeRecebimentoDTO`. */
export interface ContaDeRecebimento {
  meios: MeiosDaConta
  atualizada_em: string
  /** Quando o Presidente conferiu o titular do PIX; nulo enquanto não conferiu. */
  conferida_em: string | null
  conferida_por: string | null
}

/** A conta da turma. Sem `conta`, a comissão ainda não habilitou meio nenhum. */
export interface ContaDeRecebimentoDaTurma {
  conta: ContaDeRecebimento | null
}

export interface PixDeTeste {
  copia_e_cola: string
  valor_em_centavos: number
}

/** A conta do Mercado Pago conectada à turma. Nunca traz o token. Espelha `ProvedorConectadoDTO`. */
export interface ProvedorConectado {
  /** E-mail ou apelido da conta que autorizou. */
  conta_no_provedor: string
  conectado_em: string
  conectado_por: string | null
  /** O cartão da turma (Sprint 39). */
  cartao: CartaoDaTurma
  /**
   * Desde quando parcelas e opcionais se pagam só pelo Mercado Pago (29/09/2026). Nulo: cobrança manual — o
   * formando vê os meios da comissão e avisa o pagamento. A loja é sempre Mercado Pago.
   */
  cobranca_automatica_em: string | null
}

/** Trocar o modo de cobrança. Espelha `ModoDeCobrancaRequestDTO`. */
export interface ModoDeCobranca {
  automatica: boolean
}

/** O cartão da turma: ligado ou não, por quem e com que taxa. Espelha `CartaoDaTurmaDTO`. */
export interface CartaoDaTurma {
  /** Falso na conexão anterior ao cartão: o Presidente conecta a conta de novo antes de ligar. */
  disponivel: boolean
  /** Nulo: desligado — a opção não aparece em lugar nenhum (P7). */
  ligado_em: string | null
  ligado_por: string | null
  /** A taxa repassada a quem paga, base 10.000; nula, a turma absorve (P2). */
  taxa_repassada: number | null
}

/** Ligar ou desligar o cartão. Espelha `ConfiguracaoDoCartaoRequestDTO`. */
export interface ConfiguracaoDoCartao {
  ligado: boolean
  taxa_repassada: number | null
}

/** O Mercado Pago da turma. `provedor` nulo: ainda não conectou. Espelha `ProvedorDaTurmaDTO`. */
export interface ProvedorDaTurma {
  provedor: ProvedorConectado | null
}

/** O link de autorização foi para o e-mail de quem clicou. Espelha `AutorizacaoDoProvedorDTO`. */
export interface AutorizacaoDoProvedor {
  /** O e-mail, mascarado. */
  enviada_para: string
}

/**
 * O que a gravação dos meios deu. Espelha `GravacaoDaContaDTO`.
 *
 * Mudar o PIX ou a transferência só pede: `confirmacao_enviada_para` vem preenchido, a conta segue como estava,
 * e a troca vale pelo link do e-mail. Mudar só o dinheiro vale na hora.
 */
export interface GravacaoDaConta {
  conta: ContaDeRecebimento | null
  confirmacao_enviada_para: string | null
}
