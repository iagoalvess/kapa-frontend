import { api } from '@/lib/http/cliente'
import type {
  AutorizacaoDoProvedor,
  ContaDeRecebimento,
  ContaDeRecebimentoDaTurma,
  MeiosDaConta,
  ModoDeCobranca,
  PixDeTeste,
  ProvedorDaTurma,
  ConfiguracaoDoCartao,
} from '../types/recebimentos.types'

const CONTA = '/api/v1/recebimentos/conta'

/** A conta da turma, se já cadastrada. Tesouraria. */
export function obterConta(signal?: AbortSignal) {
  return api.get<ContaDeRecebimentoDaTurma>(CONTA, { signal })
}

/** Cadastra ou troca os meios; mexer no PIX desfaz a conferência. Só o Presidente. */
export function gravarConta(meios: MeiosDaConta) {
  return api.put<ContaDeRecebimento>(CONTA, { body: meios })
}

/** O copia-e-cola de R$ 1,00 para a chave gravada. Só o Presidente. */
export function obterPixDeTeste(signal?: AbortSignal) {
  return api.get<PixDeTeste>(`${CONTA}/pix-de-teste`, { signal })
}

/** Registra que o banco mostrou o titular cadastrado. Só o Presidente. */
export function conferirConta() {
  return api.post<ContaDeRecebimento>(`${CONTA}/conferir`)
}

const MERCADO_PAGO = `${CONTA}/mercado-pago`

/** O Mercado Pago da turma, se conectado. Tesouraria. */
export function obterMercadoPago(signal?: AbortSignal) {
  return api.get<ProvedorDaTurma>(MERCADO_PAGO, { signal })
}

/** A página do Mercado Pago onde o presidente autoriza o Kapa na conta da turma. Só o Presidente. */
export function autorizarMercadoPago() {
  return api.post<AutorizacaoDoProvedor>(`${MERCADO_PAGO}/autorizacao`)
}

/** Liga ou desliga o cartão da turma, com a taxa repassada ou absorvida (Sprint 39). Tesouraria e Presidente. */
export function configurarCartao(dados: ConfiguracaoDoCartao) {
  return api.put<ProvedorDaTurma>(`${MERCADO_PAGO}/cartao`, { body: dados })
}

/**
 * Troca entre a cobrança manual e a automática. 409 `recebimento.avisos_pendentes` ou `recebimento.pix_em_aberto`
 * enquanto há algo no meio do caminho. Tesouraria e Presidente.
 */
export function configurarCobranca(dados: ModoDeCobranca) {
  return api.put<ProvedorDaTurma>(`${MERCADO_PAGO}/cobranca`, { body: dados })
}

/** Desconecta o Mercado Pago. 409 `recebimento.cobranca_automatica_ligada` na cobrança automática. Só o Presidente. */
export function desconectarMercadoPago() {
  return api.delete<void>(MERCADO_PAGO)
}
