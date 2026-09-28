import { Armchair } from 'lucide-react'
import { formatarNumero } from '@/lib/formato'
import { useMinhasMesas } from '../hooks/useMesas'

/**
 * A mesa que o formando comprou, só para ler (P1): quem monta o mapa é a comissão.
 *
 * Some quando ele não tem mesa — comprou e a comissão ainda não atribuiu, ou não comprou.
 */
export function AvisoDaMinhaMesa() {
  const mesas = useMinhasMesas().data ?? []

  if (mesas.length === 0) return null

  return (
    <p className="bg-card text-foreground flex items-center gap-3 rounded-xl border p-4 text-sm">
      <Armchair aria-hidden className="text-brand-text size-5 shrink-0" />
      <span>
        {mesas.length === 1 ? 'Sua mesa no jantar: ' : 'Suas mesas no jantar: '}
        {mesas.map((mesa, indice) => (
          <span key={mesa.id}>
            {indice > 0 ? ', ' : null}
            <strong>{mesa.identificacao}</strong> ({formatarNumero(mesa.lugares)} lugares)
          </span>
        ))}
        .
      </span>
    </p>
  )
}
