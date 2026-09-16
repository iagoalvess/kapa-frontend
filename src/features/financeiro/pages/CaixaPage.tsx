import { ArrowDownRight, ArrowUpRight, CalendarClock, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeGrafico } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { GraficoDeCaixa } from '@/components/GraficoDeCaixa'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { fatiaDaCategoria } from '@/types/financeiro'
import { useCaixa, useProjecao } from '../hooks/useCaixa'

/**
 * Quanto a turma tem, quanto ainda entra e quanto ainda sai — a tela pela qual a comissão decide
 * contratar.
 *
 * Saldo é conta, não coluna: arrecadado menos gasto, vindo da API a cada consulta. O sinal está no
 * número, e não só na cor (negativo vem com o "−" e em vermelho).
 *
 * A projeção é desenhada hachurada e rotulada como projeção, no gráfico e na legenda. Parcela
 * vencida não entra em mês nenhum — aparece à parte, em "em atraso", porque dinheiro atrasado não é
 * dinheiro previsto.
 *
 * @param Complemento Cartões de outra feature, na mesma grade — `app/PaginaDoCaixa` passa a
 * adimplência e o gasto por fornecedor. Sem ele a tela fica inteira, só com o que o caixa sabe.
 */
export function CaixaPage({ Complemento }: { Complemento?: ComponentType }) {
  const { tem } = usePapel()
  const caixa = useCaixa()
  const projecao = useProjecao()
  const dados = caixa.data

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do caixa"
        indicadores={[
          {
            rotulo: 'Arrecadado',
            valor: dados ? formatarCentavos(dados.arrecadado_em_centavos) : null,
            icone: ArrowUpRight,
          },
          {
            rotulo: 'Gasto',
            valor: dados ? formatarCentavos(dados.gasto_em_centavos) : null,
            icone: ArrowDownRight,
          },
          {
            rotulo: 'Saldo em caixa',
            valor: dados ? formatarCentavos(dados.saldo_em_centavos) : null,
            icone: Wallet,
            sinal: dados && dados.saldo_em_centavos < 0 ? { texto: 'negativo', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'A receber',
            valor: dados ? formatarCentavos(dados.a_receber_em_centavos) : null,
            icone: CalendarClock,
            sinal:
              dados && dados.em_atraso_em_centavos > 0
                ? { texto: `${formatarCentavos(dados.em_atraso_em_centavos)} em atraso`, tom: 'negativo' }
                : undefined,
          },
        ]}
      />

      {caixa.isError ? <ErroDaConsulta erro={caixa.error} /> : null}

      {/* Sem `items-start`: lado a lado, os dois cartões têm a mesma altura — o que passar a ser o
          mais alto puxa o outro, e não sobra vão cinza entre eles e os últimos lançamentos. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Cartao
          titulo="Entradas e saídas"
          icone={TrendingUp}
          descricao="Mês a mês. Os meses à frente são projeção: o que ainda vence, não o que já aconteceu."
          className="lg:col-span-2"
        >
          {projecao.isPending ? <EsqueletoDeGrafico /> : null}

          {projecao.data ? (
            <div className="motion-safe:animate-entrar grid gap-4">
              <GraficoDeCaixa meses={projecao.data.meses} />

              <dl className="border-border grid gap-3 border-t pt-4 sm:grid-cols-3">
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground text-sm">Saldo hoje</dt>
                  <dd className="text-foreground text-lg font-medium tabular-nums">
                    {formatarCentavos(projecao.data.saldo_em_centavos)}
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground text-sm">Saldo se todos pagarem</dt>
                  <dd className="text-foreground text-lg font-medium tabular-nums">
                    {formatarCentavos(dados?.saldo_projetado_em_centavos)}
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground text-sm">Fora da projeção (em atraso)</dt>
                  <dd className="text-danger-text text-lg font-medium tabular-nums">
                    {formatarCentavos(projecao.data.em_atraso_em_centavos)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </Cartao>

        {/* `grid-rows-[auto_1fr]`: o conteúdo fica com a altura que sobra do cartão, e a rosca a
            usa para se centrar — senão o cartão, esticado pelo gráfico ao lado, vazava embaixo. */}
        <Cartao
          titulo="Gastos por categoria"
          icone={PiggyBank}
          descricao="O que já saiu e o que ainda vai sair, do maior para o menor."
          className="lg:grid-rows-[auto_1fr]"
        >
          {caixa.isPending ? <EsqueletoDeGrafico forma="rosca" /> : null}

          {dados?.por_categoria.length === 0 ? (
            <div className="grid justify-items-center gap-2 py-4 text-center">
              <img src={mascoteCofrinho} alt="" className="w-24 drop-shadow-lg" />
              <p className="text-muted-foreground text-sm">
                Nenhuma despesa lançada ainda. O que a turma contratar aparece aqui.
              </p>
            </div>
          ) : null}

          {dados && dados.por_categoria.length > 0 ? (
            <GraficoDeRosca fatias={dados.por_categoria.map(fatiaDaCategoria)} />
          ) : null}
        </Cartao>

        {/* Em metades iguais, e não 2+1: com um dos dois ocupando dois terços, sobra um vão branco
            do tamanho de uma coluna embaixo da legenda dele. */}
        {Complemento ? (
          <div className="grid gap-5 lg:col-span-3 lg:grid-cols-2">
            <Complemento />
          </div>
        ) : null}

        {/* O extrato ocupa a largura toda: com o quadro por categoria cheio, ele embaixo fecha a tela
            melhor do que espremido na coluna da direita. */}
        <Cartao
          titulo="Últimos lançamentos"
          icone={Wallet}
          descricao="Entradas e saídas, do mais recente."
          className="lg:col-span-3"
          acao={
            <>
              {/* Parcelas nomeia quem deve: é da Gestão, e para o formando o link cairia na guarda.
                  Despesas, não — ela diz no que a turma gastou, e isso todo membro lê. */}
              {tem(PAPEIS.tesoureiro, PAPEIS.comissao) ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={ROTAS.parcelas}>Ver parcelas</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link to={ROTAS.despesas}>Ver despesas</Link>
              </Button>
            </>
          }
        >
          {dados?.ultimos.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nada entrou nem saiu ainda. As entradas aparecem quando a tesouraria confere um pagamento; as
              saídas, quando uma despesa é paga.
            </p>
          ) : null}

          {dados && dados.ultimos.length > 0 ? (
            // Coluna única e linhas com respiro, como a atividade recente do modelo: são poucas
            // linhas, e em duas colunas o nome longo truncava no meio.
            <ul className="motion-safe:animate-entrar grid">
              {dados.ultimos.map((lancamento, indice) => (
                <li
                  key={`${lancamento.data}-${lancamento.descricao}-${indice}`}
                  className="border-border flex flex-wrap items-center gap-3 border-b py-3 last:border-0"
                >
                  <span
                    className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      lancamento.entrada ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
                    }`}
                  >
                    {lancamento.entrada ? (
                      <ArrowUpRight className="size-4" aria-hidden />
                    ) : (
                      <ArrowDownRight className="size-4" aria-hidden />
                    )}
                  </span>
                  {/* Nome em cima, dia embaixo: a coluna é estreita, e valor e nome na mesma linha
                      quebrariam o número para baixo. */}
                  <span className="grid min-w-0 flex-1">
                    <span className="text-foreground truncate">{lancamento.descricao}</span>
                    <span className="text-texto-muted text-xs">{formatarData(lancamento.data)}</span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${lancamento.entrada ? 'text-success-text' : 'text-danger-text'}`}
                  >
                    {lancamento.entrada ? '+' : '−'} {formatarCentavos(lancamento.valor_em_centavos)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Cartao>
      </div>
    </>
  )
}
