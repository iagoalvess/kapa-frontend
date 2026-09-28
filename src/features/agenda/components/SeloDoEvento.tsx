import { Selo, type TomDoSelo } from '@/components/Selo'
import { ROTULOS_DE_SITUACAO, type SituacaoDoEvento } from '@/types/agenda'

/**
 * O tom do selo de cada situação.
 *
 * Acompanha a cor da data no cartão (ver {@link COR_DA_DATA}): o selo é a mesma informação em texto,
 * e as duas discordarem — cartão âmbar com selo cinza — é o tipo de detalhe que faz a tela
 * parecer montada por duas pessoas.
 */
const TONS = {
  AConfirmar: 'alerta',
  Confirmado: 'sucesso',
  Cancelado: 'neutro',
} as const satisfies Record<SituacaoDoEvento, TomDoSelo>

/**
 * A cor do bloco da data, pela situação: verde no que está fechado, âmbar no que falta confirmar,
 * cinza no que foi desmarcado.
 *
 * Só o bloco leva a cor, e não o cartão inteiro: o cartão é branco sobre a coluna cinza, e a data
 * colorida basta para o quadro se ler de relance. Sai dos tokens de estado que o produto já tem —
 * "confirmado" é a mesma notícia boa de uma parcela paga, e âmbar é o mesmo "ainda não" de um
 * vencimento próximo.
 *
 * As classes são escritas por extenso porque o scanner do Tailwind lê o código como texto —
 * `bg-${situacao}-bg` não geraria classe nenhuma, e os blocos nasceriam brancos sem avisar.
 */
export const COR_DA_DATA = {
  AConfirmar: 'bg-warning-bg',
  Confirmado: 'bg-success-bg',
  Cancelado: 'bg-muted',
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
