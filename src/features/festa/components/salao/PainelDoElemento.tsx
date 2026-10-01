import { Copy, Trash2 } from 'lucide-react'
import { Dica } from '@/components/Dica'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { CORES_DA_AREA, ELEMENTOS_DO_SALAO } from '../../lib/catalogoDoSalao'
import { METRO } from '../../lib/salao'
import type { CorDaArea, ElementoDoSalao } from '../../types/mesas.types'

/** O painel do elemento escolhido no editor: nome no mapa, cor da área e o tamanho. */
export function PainelDoElemento({
  elemento,
  editavel,
  aoMudar,
  aoDuplicar,
  aoRemover,
}: {
  elemento: ElementoDoSalao
  editavel: boolean
  aoMudar: (mudanca: Partial<ElementoDoSalao>) => void
  aoDuplicar: () => void
  aoRemover: () => void
}) {
  const { icone: Icone, rotulo: tipo } = ELEMENTOS_DO_SALAO[elemento.tipo]

  return (
    <>
      <h3 className="text-foreground flex items-center gap-2 text-lg font-medium">
        <Icone aria-hidden className="text-muted-foreground size-5" />
        {tipo}
      </h3>

      <div className="grid gap-1.5">
        <Label htmlFor="rotulo-do-elemento">Nome no mapa</Label>
        <Input
          id="rotulo-do-elemento"
          value={elemento.rotulo}
          maxLength={40}
          disabled={!editavel}
          aria-invalid={!elemento.rotulo.trim()}
          onChange={(evento) => aoMudar({ rotulo: evento.target.value })}
        />
      </div>

      {elemento.tipo === 'Area' ? (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Cor</legend>
          <div className="flex gap-2">
            {(Object.keys(CORES_DA_AREA) as CorDaArea[]).map((cor) => (
              <Dica key={cor} dica={CORES_DA_AREA[cor].rotulo}>
                <button
                  type="button"
                  aria-pressed={elemento.cor === cor}
                  aria-label={CORES_DA_AREA[cor].rotulo}
                  disabled={!editavel}
                  onClick={() => aoMudar({ cor })}
                  className={cn(
                    'size-9 cursor-pointer rounded-xl border-2 border-transparent',
                    CORES_DA_AREA[cor].amostra,
                    elemento.cor === cor && 'border-brand',
                  )}
                />
              </Dica>
            ))}
          </div>
        </fieldset>
      ) : null}

      <p className="text-muted-foreground text-sm">
        {formatarNumero(elemento.largura / METRO)} m × {formatarNumero(elemento.altura / METRO)} m — puxe o
        canto para mudar o tamanho.
      </p>

      {editavel ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={aoDuplicar}>
            <Copy aria-hidden />
            Duplicar
          </Button>
          <Button variant="outline" size="sm" className="text-danger-text" onClick={aoRemover}>
            <Trash2 aria-hidden />
            Excluir
          </Button>
        </div>
      ) : null}
    </>
  )
}
