// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  meu: () => ['formandos', 'eu'] as const,
  detalhe: (usuario_id: string) => ['formandos', 'detalhe', usuario_id] as const,
  foto: (arquivoId: string) => ['formandos', 'foto', arquivoId] as const,
}
