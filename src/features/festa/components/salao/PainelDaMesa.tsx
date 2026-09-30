import { RotateCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useExcluirMesa } from '../../hooks/useMesas'
import type { CompradorDeMesa, Mesa } from '../../types/mesas.types'
import { SeletorDeDono } from '../SeletorDeDono'

/** O painel da mesa escolhida no editor: o cadastro, o dono e o que se faz com ela no mapa. */
export function PainelDaMesa({
  mesa,
  compradores,
  editavel,
  aoEditar,
  aoGirar,
  aoTirarDoMapa,
  aoExcluir,
}: {
  mesa: Mesa
  compradores: CompradorDeMesa[]
  editavel: boolean
  aoEditar: () => void
  aoGirar: () => void
  aoTirarDoMapa: () => void
  aoExcluir: () => void
}) {
  const excluir = useExcluirMesa()

  return (
    <>
      <div className="grid gap-1">
        <h3 className="text-foreground flex flex-wrap items-center gap-2 text-lg font-medium">
          {mesa.identificacao}
          {mesa.reservada ? <Selo>Reservada</Selo> : null}
        </h3>
        <p className="text-muted-foreground text-sm">
          {mesa.formato === 'Redonda' ? 'Redonda' : 'Retangular'}, {formatarNumero(mesa.lugares)} lugares
          {mesa.observacao ? ` · ${mesa.observacao}` : ''}
        </p>
      </div>

      {mesa.reservada ? null : (
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Dono</span>
          {editavel ? (
            <SeletorDeDono mesa={mesa} compradores={compradores} className="w-full" />
          ) : (
            <span className="text-sm">{mesa.dono ?? 'Sem dono'}</span>
          )}
        </div>
      )}

      {editavel ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={aoEditar}>
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={aoGirar}
            disabled={mesa.formato === 'Redonda'}
            title={mesa.formato === 'Redonda' ? 'Mesa redonda não gira' : undefined}
          >
            <RotateCw aria-hidden />
            Girar
          </Button>
          <Button variant="outline" size="sm" onClick={aoTirarDoMapa} disabled={mesa.x === null}>
            Tirar do mapa
          </Button>
          <DialogoDeConfirmacao
            gatilho={
              <Button variant="outline" size="sm" disabled={excluir.isPending || !!mesa.vinculo_id}>
                <Trash2 aria-hidden />
                Excluir
              </Button>
            }
            titulo={`Excluir “${mesa.identificacao}”?`}
            descricao="A mesa sai do mapa e da lista. Mesa com dono não se exclui: solte o dono antes."
            rotulo="Excluir"
            destrutivo
            aoConfirmar={() =>
              excluir.mutate(mesa.id, {
                onSuccess: () => {
                  toast.info('Mesa excluída.')
                  aoExcluir()
                },
                onError: avisarErro,
              })
            }
          />
        </div>
      ) : null}
    </>
  )
}
