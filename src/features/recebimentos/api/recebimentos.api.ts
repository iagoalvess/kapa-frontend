import { api } from '@/lib/http/cliente'
import type {
  AutorizacaoDoProvedor,
  ContaDeRecebimento,
  ContaDeRecebimentoDaTurma,
  MeiosDaConta,
  PixDeTeste,
  ProvedorDaTurma,
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

/** Desconecta o Mercado Pago; os outros meios continuam. Só o Presidente. */
export function desconectarMercadoPago() {
  return api.delete<void>(MERCADO_PAGO)
}
