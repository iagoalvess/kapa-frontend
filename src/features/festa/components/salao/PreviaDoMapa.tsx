import { MapaDoSalao, type MesaNoMapa } from '../MapaDoSalao'
import type { MapaDeMesas, Mesa } from '../../types/mesas.types'

/**
 * O salão só de ler, para a prévia do card lateral de Mesas.
 *
 * A edição mora na página do mapa (`/festa/mesas/mapa`): aqui é a miniatura que mostra onde as
 * mesas estão, sem arrasto — o mesmo desenho do editor, sem os controles.
 */
export function PreviaDoMapa({ mapa }: { mapa: MapaDeMesas }) {
  const mesas: MesaNoMapa[] = mapa.lista
    .filter((mesa): mesa is Mesa & { x: number; y: number } => mesa.x !== null && mesa.y !== null)
    .map((mesa) => ({
      id: mesa.id,
      identificacao: mesa.identificacao,
      lugares: mesa.lugares,
      formato: mesa.formato,
      girada: mesa.girada,
      x: mesa.x,
      y: mesa.y,
      tom: mesa.reservada ? 'reservada' : mesa.vinculo_id ? 'dono' : 'livre',
      legenda: mesa.reservada ? 'Reservada' : mesa.dono,
    }))

  return (
    <div className="bg-background overflow-hidden rounded-2xl border p-2">
      <MapaDoSalao salao={mapa.salao} mesas={mesas} rotulo="Mapa do salão" />
    </div>
  )
}
