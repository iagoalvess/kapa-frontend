/** Situação da assinatura. Espelha `StatusDaAssinatura`. */
export type StatusDaAssinatura = 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada'

/**
 * O nome e a cor de cada situação da assinatura.
 *
 * Mora aqui porque a tela da assinatura (feature `assinaturas`) e o painel de suporte (feature
 * `suporte`) mostram o mesmo status — e cada uma tinha o seu mapa, com "Pendente" num e "Aguardando
 * pagamento" no outro para a mesma assinatura.
 */
export const APARENCIA_DA_ASSINATURA = {
  Pendente: { rotulo: 'Aguardando pagamento', tom: 'alerta' },
  Ativa: { rotulo: 'Ativa', tom: 'sucesso' },
  Vencida: { rotulo: 'Vencida', tom: 'perigo' },
  Cancelada: { rotulo: 'Renovação cancelada', tom: 'neutro' },
} as const satisfies Record<StatusDaAssinatura, { rotulo: string; tom: string }>
