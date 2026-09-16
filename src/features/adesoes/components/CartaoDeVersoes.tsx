import { Cartao } from '@/components/Cartao'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { useTermos } from '../hooks/useTermo'

/**
 * As versões já publicadas do termo, com a data e quantos aceitaram cada uma, na mesma tabela de
 * "O que você vai pagar" — é o outro cartão da coluna.
 *
 * Só o Presidente vê — a API recusa a lista para os demais, e é ele quem chega aqui pelo
 * "Visualizar" da tela de adesões. Sem versão publicada, não há cartão.
 *
 * @param className Posição na grade de quem chama.
 */
export function CartaoDeVersoes({ className }: { className?: string }) {
  const { ehPresidente } = usePapel()
  const termos = useTermos(ehPresidente)

  if (!termos.data || termos.data.length === 0) return null

  return (
    <Cartao titulo="Versões publicadas" className={cn('motion-safe:animate-entrar', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Versões publicadas do termo</caption>
          <thead className="text-texto-muted bg-muted/60 text-left text-xs">
            <tr>
              <th className="rounded-l-lg px-3 py-2 font-normal">Versão</th>
              <th className="px-3 py-2 font-normal">Desde</th>
              <th className="rounded-r-lg px-3 py-2 text-right font-normal">Adesões</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {termos.data.map((versao) => (
              <tr key={versao.id} className="border-b last:border-0">
                <td className="text-foreground px-3 py-2.5 font-medium">v{versao.versao}</td>
                <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                  {formatarData(versao.vigente_desde)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">{formatarNumero(versao.adesoes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="bg-muted/60 text-foreground rounded-xl px-4 py-3 text-sm">
        Quem aderiu continua na versão que aceitou.
      </p>
    </Cartao>
  )
}
