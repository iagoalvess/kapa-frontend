import { Selo } from '@/components/Selo'
import { ROTULOS_DE_SITUACAO, type SituacaoDoEvento } from '@/types/agenda'

/**
 * O tom do selo de cada situação.
 *
 * Acompanha a cor do cartão (ver {@link COR_DA_SITUACAO}): o selo é a mesma informação em texto,
 * e as duas discordarem — cartão âmbar com selo cinza — é o tipo de detalhe que faz a tela
 * parecer montada por duas pessoas.
 */
const TONS = {
  AConfirmar: 'alerta',
  Confirmado: 'sucesso',
  Cancelado: 'neutro',
} as const satisfies Record<SituacaoDoEvento, 'alerta' | 'sucesso' | 'neutro'>

/**
 * A cor leve do cartão, pela situação: verde no que está fechado, âmbar no que falta confirmar,
 * cinza no que foi desmarcado.
 *
 * Sai dos tokens de estado que o produto já tem, e não de uma paleta nova: "confirmado" é a mesma
 * notícia boa de uma parcela paga, e âmbar é o mesmo "ainda não" de um vencimento próximo.
 *
 * As classes são escritas por extenso porque o scanner do Tailwind lê o código como texto —
 * `bg-${situacao}-bg` não geraria classe nenhuma, e os cartões nasceriam brancos sem avisar.
 */
export const COR_DA_SITUACAO = {
  AConfirmar: 'border-warning bg-warning-bg/60 hover:bg-warning-bg',
  Confirmado: 'border-success bg-success-bg/60 hover:bg-success-bg',
  // Branco, e não cinza: o cartão agora vive numa coluna cinza, e `bg-muted` sumiria nela.
  Cancelado: 'border-border bg-card hover:bg-card',
} as const satisfies Record<SituacaoDoEvento, string>

/**
 * A etiqueta de situação do evento.
 *
 * Ao contrário do selo do item da festa, esta é digitada pela comissão: nada no sistema sabe se o
 * salão confirmou a data.
 *
 * @param situacao Situação do evento.
 */
export function SeloDoEvento({ situacao }: { situacao: SituacaoDoEvento }) {
  return <Selo tom={TONS[situacao]}>{ROTULOS_DE_SITUACAO[situacao]}</Selo>
}
