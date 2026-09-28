export const chaves = {
  tudo: ['assinaturas'] as const,
  /** O id da formatura entra na chave: trocar de turma nunca reaproveita a assinatura da anterior. */
  atual: (formaturaId: string | null) => ['assinaturas', 'atual', formaturaId] as const,
  cobrancas: (formaturaId: string | null) => ['assinaturas', 'cobrancas', formaturaId] as const,
}
