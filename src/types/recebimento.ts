/**
 * Como a turma aceita receber, e como o formando diz ter pago. Espelha `MeioDeRecebimento`.
 *
 * A turma habilita os três primeiros, e cada um é um destino conferível — uma chave, uma conta, uma
 * pessoa. `Outro` não é habilitável: ele só existe do lado do aviso, para quem pagou de um jeito que
 * ninguém previu (P7 de 21/09/2026).
 *
 * "Combinar com a comissão" foi retirado em 21/09/2026, depois de implementado: era o único meio sem
 * destino a conferir, e o único que quebrava a sequência "pague (1), avise (2)" da tela — quem
 * escolhia combinar ainda não tinha pago.
 *
 * Mora em `types/` porque a comissão o habilita na feature `recebimentos` e o formando o escolhe na
 * feature `pagamentos` — e uma feature não importa de outra.
 */
export type MeioDeRecebimento = 'Pix' | 'Transferencia' | 'Dinheiro' | 'Outro'

/** Como cada meio aparece na tela: o rótulo e a frase de uma linha que o explica. */
export const MEIOS: Record<MeioDeRecebimento, { rotulo: string; descricao: string }> = {
  Pix: { rotulo: 'PIX', descricao: 'O QR e o copia-e-cola da chave da turma.' },
  Transferencia: { rotulo: 'Transferência', descricao: 'Os dados da conta, para o formando copiar.' },
  Dinheiro: { rotulo: 'Dinheiro', descricao: 'Em mãos, com quem a comissão indicar.' },
  Outro: { rotulo: 'Outro', descricao: 'Um jeito que a turma não listou.' },
}

/** O nome do meio na tela. Sem meio — aviso anterior à Sprint 18 —, um traço. */
export const rotuloDoMeio = (meio: MeioDeRecebimento | null) => (meio ? MEIOS[meio].rotulo : '—')

/**
 * A conta para quem vai transferir. Espelha `DadosBancariosDTO`.
 *
 * Texto livre, sem dígito conferido (P5 de 21/09/2026): o Kapa não transfere nada, só mostra o que a
 * comissão digitou. Aparece na tela da comissão, que o preenche, e na do formando, que o copia.
 */
export interface DadosBancarios {
  banco: string
  agencia: string
  conta: string
  /** "Corrente" ou "Poupança". */
  tipo_de_conta: string
  titular: string
}
