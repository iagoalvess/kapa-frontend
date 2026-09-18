// A formatura não entra em nenhuma chave, e aqui é mais que convenção: o portal é do **titular**, e
// o que ele mostra atravessa as turmas. Trocar de formatura limpa o cache inteiro de qualquer jeito.
export const chaves = {
  tudo: ['privacidade'] as const,
  /** Tudo o que a Kapa guarda sobre o titular. */
  meusDados: ['privacidade', 'meus-dados'] as const,
  /** A fila de pedidos — o `POST` a invalida, e ela se repete enquanto houver algo pendente. */
  solicitacoes: ['privacidade', 'solicitacoes'] as const,
  /** Com quem a Kapa compartilha. Anônimo e praticamente imutável. */
  operadores: ['privacidade', 'operadores'] as const,
}
