import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { APARENCIA_DA_COBRANCA, MOTIVO_DA_COBRANCA } from '@/types/assinatura'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { useCobrancasDoPlano } from '../hooks/useAssinatura'

/**
 * O histórico de pagamentos do plano (Sprint 37): cada PIX de ciclo, cada débito do cartão e a diferença da
 * subida de plano, com o que foi estornado.
 *
 * Mora ao lado do cartão da assinatura, na coluna lateral — sem ícone no título. Turma que nunca pagou não vê
 * cartão nenhum: uma tabela vazia no gratuito só ocupa lugar — e nem consulta.
 *
 * @param jaContratou O `ja_contratou` da formatura da sessão; falso, não há pagamento a listar.
 */
export function CartaoDePagamentosDoPlano({ jaContratou }: { jaContratou: boolean }) {
  return jaContratou ? <PagamentosDoPlano /> : null
}

function PagamentosDoPlano() {
  const cobrancas = useCobrancasDoPlano()

  if (cobrancas.isPending)
    return (
      <Cartao titulo="Pagamentos do plano">
        <EsqueletoDeDados linhas={3} />
      </Cartao>
    )

  if (cobrancas.isError)
    return (
      <Cartao titulo="Pagamentos do plano">
        <ErroDaConsulta compacto erro={cobrancas.error} aoTentarDeNovo={() => void cobrancas.refetch()} />
      </Cartao>
    )

  if (cobrancas.data.length === 0) return null

  return (
    <Cartao titulo="Pagamentos do plano" className="motion-safe:animate-entrar">
      <Tabela
        variante="faixa"
        legenda="Pagamentos do plano"
        cabecalho={
          <>
            <th>Data</th>
            <th>Pagamento</th>
            <th className="text-right">Valor</th>
          </>
        }
      >
        {cobrancas.data.map((cobranca) => {
          const aparencia = APARENCIA_DA_COBRANCA[cobranca.situacao]

          return (
            <tr key={cobranca.id} className="border-b last:border-0">
              <td className="text-muted-foreground px-3 py-2.5 align-top whitespace-nowrap">
                {formatarData(cobranca.paga_em ?? cobranca.criada_em)}
              </td>
              <td className="px-3 py-2.5 align-top">
                <span className="text-foreground block font-medium">
                  {MOTIVO_DA_COBRANCA[cobranca.motivo]} · {cobranca.plano_nome}
                </span>
                <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  {MEIOS_DE_PAGAMENTO[cobranca.meio].rotulo}
                  <Selo tom={aparencia.tom}>{aparencia.rotulo}</Selo>
                </span>
              </td>
              <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">
                {formatarCentavos(cobranca.valor_em_centavos)}
                {cobranca.valor_estornado_em_centavos ? (
                  <span className="text-muted-foreground block text-xs">
                    − {formatarCentavos(cobranca.valor_estornado_em_centavos)}
                  </span>
                ) : null}
              </td>
            </tr>
          )
        })}
      </Tabela>
    </Cartao>
  )
}
