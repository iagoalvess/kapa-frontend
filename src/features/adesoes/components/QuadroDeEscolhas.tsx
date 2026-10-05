import { Cartao } from '@/components/Cartao'
import { formatarCentavos } from '@/lib/formato'
import { beneficiosPorExtenso, rotuloDoItem } from '@/types/cobranca'
import type { PacoteDaCesta } from '../types/adesoes.types'

/**
 * O anexo do termo assinado (Sprint 47, D3): os pacotes que a pessoa contratou e o que cada um concede — o mesmo
 * quadro do PDF. Adesão anterior à cesta não tem quadro, e o cartão não aparece.
 */
export function QuadroDeEscolhas({ cesta }: { cesta: PacoteDaCesta[] | null }) {
  if (!cesta?.length) return null

  return (
    <Cartao
      titulo="Quadro de escolhas"
      descricao="Os pacotes que você contratou. Fazem parte do termo assinado."
    >
      <ul className="grid gap-3">
        {cesta.map((pacote) => (
          <li key={pacote.item_id} className="flex items-start justify-between gap-4 text-sm">
            <span className="grid">
              <span className="text-foreground font-medium">
                {pacote.grupo ? `${pacote.grupo} — ${rotuloDoItem(pacote)}` : rotuloDoItem(pacote)}
              </span>
              {beneficiosPorExtenso(pacote) ? (
                <span className="text-muted-foreground text-xs">{beneficiosPorExtenso(pacote)}</span>
              ) : null}
            </span>
            <span className="text-foreground tabular-nums">{formatarCentavos(pacote.valor_em_centavos)}</span>
          </li>
        ))}
      </ul>
    </Cartao>
  )
}
