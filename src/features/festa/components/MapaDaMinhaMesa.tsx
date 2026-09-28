import { Armchair } from 'lucide-react'
import { useState } from 'react'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { formatarNumero } from '@/lib/formato'
import { useSalaoDoFormando } from '../hooks/useMesas'
import type { MesaNoSalao } from '../types/mesas.types'
import { MapaDoSalao, type MesaNoMapa } from './MapaDoSalao'

/**
 * A mesa do formando e o mapa do salão, só para ler (P1 e P9): quem monta o mapa é a comissão, e o
 * nome dos donos das outras mesas não aparece.
 *
 * Some quando não há nada a mostrar — nem mesa dele, nem mapa desenhado. O mapa abre num diálogo,
 * para não empurrar a lista da festa para baixo em toda visita.
 */
export function MapaDaMinhaMesa() {
  const [aberto, definirAberto] = useState(false)
  const dados = useSalaoDoFormando().data

  if (!dados) return null

  const minhas = dados.mesas.filter((mesa) => mesa.minha)
  const noMapa = dados.mesas.filter(
    (mesa): mesa is MesaNoSalao & { x: number; y: number } => mesa.x !== null && mesa.y !== null,
  )
  const temMapa = noMapa.length > 0 || dados.salao.elementos.length > 0

  if (minhas.length === 0 && !temMapa) return null

  return (
    <div className="bg-card text-foreground flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm">
      <Armchair aria-hidden className="text-brand-text size-5 shrink-0" />
      <span className="min-w-0 flex-1">
        {minhas.length === 0 ? (
          'O mapa do salão já está montado.'
        ) : (
          <>
            {minhas.length === 1 ? 'Sua mesa no jantar: ' : 'Suas mesas no jantar: '}
            {minhas.map((mesa, indice) => (
              <span key={mesa.id}>
                {indice > 0 ? ', ' : null}
                <strong>{mesa.identificacao}</strong> ({formatarNumero(mesa.lugares)} lugares)
              </span>
            ))}
            .
          </>
        )}
      </span>
      {temMapa ? (
        <Button variant="outline" size="xs" onClick={() => definirAberto(true)}>
          Ver mapa do salão
        </Button>
      ) : null}

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Mapa do salão"
        descricao={
          minhas.length > 0
            ? 'Sua mesa está em laranja. A posição é aproximada.'
            : 'A posição das mesas é aproximada.'
        }
        largura="largo"
      >
        <div className="bg-background overflow-auto rounded-2xl border p-3">
          <MapaDoSalao salao={dados.salao} mesas={noMapa.map(paraOMapa)} rotulo="Mapa do salão" />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => definirAberto(false)}>
            Fechar
          </Button>
        </div>
      </DialogoDeFormulario>
    </div>
  )
}

function paraOMapa(mesa: MesaNoSalao & { x: number; y: number }): MesaNoMapa {
  return {
    ...mesa,
    tom: mesa.minha ? 'dono' : mesa.reservada ? 'reservada' : 'livre',
    legenda: mesa.minha ? 'Sua mesa' : mesa.reservada ? 'Reservada' : null,
  }
}
