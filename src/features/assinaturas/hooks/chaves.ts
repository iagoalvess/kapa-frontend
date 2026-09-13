export const chaves = {
  planos: () => ['planos'] as const,
  tudo: ['assinatura'] as const,
  /** O id da formatura entra na chave: trocar de turma nunca reaproveita a assinatura da anterior. */
  atual: (formaturaId: string | null) => ['assinatura', 'atual', formaturaId] as const,
}
