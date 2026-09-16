import { Check, LayoutGrid, Minus } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { cn } from '@/lib/utils'
import type { Plano } from '../types/assinaturas.types'

/**
 * A tabela "o que vem em cada plano": um módulo por linha, um plano por coluna.
 *
 * As linhas saem dos próprios planos, na ordem em que aparecem do mais barato ao mais caro — o
 * catálogo manda, e módulo novo entra sem tocar nesta tela.
 *
 * @param planos Os planos exibidos, já filtrados pelo ciclo.
 */
export function CartaoDeModulos({ planos }: { planos: Plano[] }) {
  const modulos = [...new Set(planos.flatMap((plano) => plano.modulos))]

  if (modulos.length === 0) return null

  return (
    <Cartao
      titulo="Módulos incluídos"
      icone={LayoutGrid}
      descricao="O que cada plano libera para a comissão."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-texto-muted text-left text-xs">
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4 font-normal">
                Módulo
              </th>
              {planos.map((plano) => (
                <th key={plano.id} scope="col" className="px-3 py-2 text-center font-normal">
                  {plano.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modulos.map((modulo) => (
              <tr key={modulo} className="border-b last:border-0">
                <th scope="row" className="text-foreground py-2.5 pr-4 text-left font-normal">
                  {modulo}
                </th>
                {planos.map((plano) => (
                  <td key={plano.id} className="px-3 py-2.5 text-center">
                    <Incluso incluso={plano.modulos.includes(modulo)} plano={plano.nome} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  )
}

/** O certo ou o traço da célula. O texto é só para o leitor de tela: a coluna já diz o plano. */
function Incluso({ incluso, plano }: { incluso: boolean; plano: string }) {
  const Icone = incluso ? Check : Minus

  return (
    <>
      <Icone
        className={cn('inline size-4', incluso ? 'text-brand-text' : 'text-texto-muted')}
        strokeWidth={2.5}
        aria-hidden
      />
      <span className="sr-only">{incluso ? `Incluído no ${plano}` : `Não incluído no ${plano}`}</span>
    </>
  )
}
