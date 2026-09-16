import { api } from '@/lib/http/cliente'
import type {
  ContaDeRecebimento,
  ContaDeRecebimentoDaTurma,
  DadosDaConta,
  PixDeTeste,
} from '../types/recebimentos.types'

const CONTA = '/api/v1/recebimentos/conta'

/** A conta da turma, se já cadastrada. Tesouraria. */
export function obterConta(signal?: AbortSignal) {
  return api.get<ContaDeRecebimentoDaTurma>(CONTA, { signal })
}

/** Cadastra ou troca a chave; a conta volta a não conferida. Só o Presidente. */
export function gravarConta(dados: DadosDaConta) {
  return api.put<ContaDeRecebimento>(CONTA, { body: dados })
}

/** O copia-e-cola de R$ 1,00 para a chave gravada. Só o Presidente. */
export function obterPixDeTeste(signal?: AbortSignal) {
  return api.get<PixDeTeste>(`${CONTA}/pix-de-teste`, { signal })
}

/** Registra que o banco mostrou o titular cadastrado. Só o Presidente. */
export function conferirConta() {
  return api.post<ContaDeRecebimento>(`${CONTA}/conferir`)
}
