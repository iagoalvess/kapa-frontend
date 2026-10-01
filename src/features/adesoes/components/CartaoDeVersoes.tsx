import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { Tabela } from '@/components/Planilha'
import { useTermos } from '../hooks/useTermo'

/**
 * As versões já publicadas do termo, com a data e quantos aceitaram cada uma, na mesma tabela de
 * "O que você vai pagar" — é o outro cartão da coluna.
 *
 * Só o Presidente vê — a API recusa a lista para os demais, e é ele quem chega aqui pelo
 * "Visualizar" da tela de adesões. Sem versão publicada, não há cartão.
 */
export function CartaoDeVersoes() {
  const { ehPresidente } = usePapel()
  const termos = useTermos(ehPresidente)

  if (!termos.data || termos.data.length === 0) return null

  return (
    <Cartao titulo="Versões publicadas" className="motion-safe:animate-entrar">
      <Tabela
        variante="faixa"
        legenda="Versões publicadas do termo"
        cabecalho={
          <>
            <th>Versão</th>
            <th>Desde</th>
            <th className="text-right">Adesões</th>
          </>
        }
      >
        {termos.data.map((versao) => (
          <tr key={versao.id} className="border-b last:border-0">
            <td className="text-foreground px-3 py-2.5 font-medium">v{versao.versao}</td>
            <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
              {formatarData(versao.vigente_desde)}
            </td>
            <td className="px-3 py-2.5 text-right whitespace-nowrap">{formatarNumero(versao.adesoes)}</td>
          </tr>
        ))}
      </Tabela>

      <TextoDoCartao className="bg-muted/60 text-foreground rounded-xl px-4 py-3">
        Quem aderiu continua na versão que aceitou.
      </TextoDoCartao>
    </Cartao>
  )
}
