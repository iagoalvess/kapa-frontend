import { Selo } from '@/components/Selo'
import { type EstadoDoItem, ROTULOS_DE_ESTADO } from '@/types/festa'

/**
 * O tom de cada estado.
 *
 * `A contratar` é cinza e não alerta: item sem fornecedor é o começo normal de toda turma, não uma
 * pendência vermelha. `Pago` é o único verde — é o que a turma quer ver nos seis cartões.
 */
const TONS = {
  AContratar: 'cinza',
  Contratado: 'marca',
  Pago: 'sucesso',
  Cancelado: 'neutro',
} as const satisfies Record<EstadoDoItem, 'cinza' | 'marca' | 'sucesso' | 'neutro'>

/**
 * A etiqueta de estado do item da festa.
 *
 * O estado vem calculado da API, das despesas vinculadas — lançar ou pagar uma despesa muda este
 * selo sem ninguém editar o item.
 *
 * @param estado Estado do item.
 */
export function SeloDoItem({ estado }: { estado: EstadoDoItem }) {
  return <Selo tom={TONS[estado]}>{ROTULOS_DE_ESTADO[estado]}</Selo>
}
