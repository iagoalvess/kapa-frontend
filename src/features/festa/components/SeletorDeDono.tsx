import { toast } from 'sonner'
import { Select } from '@/components/Select'
import { avisarErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { useDefinirDonoDaMesa } from '../hooks/useMesas'
import type { CompradorDeMesa, Mesa } from '../types/mesas.types'

/**
 * Quem é o dono da mesa: o atual, "Sem dono" e os compradores que ainda têm mesa a receber. Grava na
 * hora — é a mesma escolha na lista e no painel do mapa.
 *
 * Quem já tem todas as mesas que comprou não aparece — a API recusaria com
 * `festa.mesas_alem_do_pedido`, e a opção só existiria para dar erro.
 */
export function SeletorDeDono({
  mesa,
  compradores,
  className,
}: {
  mesa: Mesa
  compradores: CompradorDeMesa[]
  className?: string
}) {
  const definir = useDefinirDonoDaMesa()
  const disponiveis = compradores.filter(
    (comprador) => comprador.vinculo_id === mesa.vinculo_id || comprador.atribuidas < comprador.compradas,
  )

  return (
    <Select
      aria-label={`Dono da ${mesa.identificacao}`}
      className={cn('h-9 min-w-44 text-sm md:text-sm', className)}
      value={mesa.vinculo_id ?? ''}
      disabled={definir.isPending}
      onChange={(evento) => {
        const vinculoId = evento.target.value || null
        definir.mutate(
          { id: mesa.id, vinculoId },
          {
            onSuccess: () => (vinculoId ? toast.success('Mesa atribuída.') : toast.info('Mesa sem dono.')),
            onError: avisarErro,
          },
        )
      }}
    >
      <option value="">Sem dono</option>
      {mesa.vinculo_id && !disponiveis.some((comprador) => comprador.vinculo_id === mesa.vinculo_id) ? (
        <option value={mesa.vinculo_id}>{mesa.dono}</option>
      ) : null}
      {disponiveis.map((comprador) => (
        <option key={comprador.vinculo_id} value={comprador.vinculo_id}>
          {comprador.vinculo_id === mesa.vinculo_id
            ? comprador.nome
            : `${comprador.nome} (${comprador.atribuidas} de ${comprador.compradas})`}
        </option>
      ))}
    </Select>
  )
}
