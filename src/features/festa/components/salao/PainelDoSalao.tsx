import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { limitar, METRO, type Tamanho } from '../../lib/salao'
import type { PlantaDoSalao } from '../../types/mesas.types'

/**
 * Sem nada escolhido, o painel é o do salão: o tamanho, em metros. O número só vale ao sair do campo
 * (ou no Enter) — enquanto se digita "2" a caminho de "24", o salão não encolhe para 6 m e empurra
 * tudo para o canto.
 */
export function PainelDoSalao({
  salao,
  editavel,
  aoMudar,
}: {
  salao: PlantaDoSalao
  editavel: boolean
  aoMudar: (tamanho: Tamanho) => void
}) {
  const campo = (lado: 'largura' | 'altura', rotulo: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`salao-${lado}`}>{rotulo}</Label>
      <Input
        key={salao[lado]}
        id={`salao-${lado}`}
        type="number"
        inputMode="decimal"
        min={6}
        max={100}
        step={0.5}
        defaultValue={salao[lado] / METRO}
        disabled={!editavel}
        onKeyDown={(evento) => (evento.key === 'Enter' ? evento.currentTarget.blur() : null)}
        onBlur={(evento) => {
          const metros = Number(evento.target.value.replace(',', '.'))
          const centimetros =
            Number.isFinite(metros) && metros > 0 ? Math.round(limitar(metros, 6, 100) * 2) * 50 : salao[lado]
          evento.target.value = String(centimetros / METRO)
          if (centimetros !== salao[lado])
            aoMudar({ largura: salao.largura, altura: salao.altura, [lado]: centimetros })
        }}
      />
    </div>
  )

  return (
    <>
      <div className="grid gap-1">
        <h3 className="text-foreground text-lg font-medium">Salão</h3>
        <p className="text-muted-foreground text-sm">
          O tamanho é aproximado: serve para as mesas e a pista ficarem na proporção certa.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {campo('largura', 'Largura (m)')}
        {campo('altura', 'Profundidade (m)')}
      </div>
      <ul className="text-muted-foreground grid list-disc gap-1 pl-4 text-sm">
        <li>Clique numa mesa ou elemento para editar.</li>
        <li>Use a Área para nomear trechos do salão: “Família”, “Próximo ao palco”.</li>
        <li>Nada vai para a turma até você salvar o mapa.</li>
      </ul>
    </>
  )
}
