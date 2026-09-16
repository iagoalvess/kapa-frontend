import { ArrowDownRight, ArrowUpRight, Coins, Handshake, Gauge, PiggyBank, Scale, Wallet } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao, EsqueletoDeGrafico } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { GraficoDeCaixa, type MesDoGrafico } from '@/components/GraficoDeCaixa'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { ehDia, formatarCentavos } from '@/lib/formato'
import { FiltrosDoRelatorio } from '../components/FiltrosDoRelatorio'
import { MedidorDeAdimplencia } from '../components/MedidorDeAdimplencia'
import { QuadroDoBalancete } from '../components/QuadroDoBalancete'
import { useDashboardPublico } from '../hooks/useDashboard'
import { useBalancete, useExportar, useOpcoesDeFiltro, useSolicitarRelatorio } from '../hooks/useRelatorios'
import {
  type Balancete,
  CAMPOS_DE_FILTRO,
  type FiltroDoRelatorio,
  type FormatoDoRelatorio,
  variacao,
} from '../types/relatorios.types'

/**
 * Os meses do balancete na forma que o gráfico do caixa espera.
 *
 * Nada aqui é projeção — o período de um relatório já aconteceu —, então o previsto vai zerado e
 * nenhum mês é `projetado`: o desenho fica só com as duas curvas cheias. O acumulado é o resultado
 * correndo dentro do período, que é o que a tabela do leitor de tela mostra.
 */
function paraOGrafico(meses: Balancete['meses']): MesDoGrafico[] {
  let acumulado = 0

  return meses.map((mes) => {
    acumulado += mes.entradas_em_centavos - mes.saidas_em_centavos

    return {
      mes: mes.mes,
      projetado: false,
      entradas_em_centavos: mes.entradas_em_centavos,
      entradas_previstas_em_centavos: 0,
      saidas_em_centavos: mes.saidas_em_centavos,
      saidas_previstas_em_centavos: 0,
      saldo_acumulado_em_centavos: acumulado,
    }
  })
}

/**
 * O recorte como o `useFiltrosDaUrl` o grava: `null` apaga o parâmetro, e é assim que um filtro se
 * desliga sem deixar `?categoria=` na barra de endereço.
 *
 * @param filtro Recorte escolhido.
 */
function paraUrl(filtro: FiltroDoRelatorio) {
  return Object.fromEntries(
    (['de', 'ate', ...CAMPOS_DE_FILTRO] as const).map((campo) => [campo, filtro[campo] ?? null]),
  )
}

/**
 * O balancete do período, as exportações e a fila de PDFs — a tela de relatórios do modelo
 * (`docs/design/modelo/relatorios.png`).
 *
 * De cima para baixo: a barra de filtros no padrão das listas do sistema, os números do período com
 * a variação contra o período anterior, a evolução mês a mês ao lado da rosca das saídas, os
 * quadros detalhados. O PDF pedido não tem card próprio: quem fala da fila é o toast, que nasce
 * girando e baixa o arquivo sozinho quando fica pronto.
 *
 * **O período vive na URL** (`?de=&ate=`): recarregar, voltar e mandar o link devolvem o mesmo
 * relatório — e é assim que o tesoureiro manda "olha o balancete de março a junho" para a comissão.
 *
 * O saldo em caixa não tem período: ele é o de hoje, o mesmo do painel, e por isso é o único
 * indicador sem comparação — variação de um número que não é do intervalo seria invenção.
 */
export default function RelatoriosPage() {
  const { parametros, atualizar } = useFiltrosDaUrl()

  const de = parametros.get('de')
  const ate = parametros.get('ate')
  // Data fora do formato na barra de endereço vira "sem filtro", e a API assume o padrão dela.
  const periodo = { de: ehDia(de) ? de : undefined, ate: ehDia(ate) ? ate : undefined }

  // O recorte inteiro vive na URL, com o período: recarregar, voltar e mandar o link devolvem o
  // mesmo relatório — que é como o tesoureiro diz "olha as despesas do buffet de março a junho".
  const filtro: FiltroDoRelatorio = {
    ...periodo,
    ...Object.fromEntries(
      CAMPOS_DE_FILTRO.map((campo) => [campo, parametros.get(campo) ?? undefined]).filter(
        ([, valor]) => valor !== undefined,
      ),
    ),
  }

  // O formato também vive na URL: quem exporta tudo em PDF escolhe uma vez, e o link leva junto.
  const formato: FormatoDoRelatorio = parametros.get('formato') === 'pdf' ? 'pdf' : 'excel'

  // O balancete da tela ignora o recorte, como o do arquivo: ele é o consolidado do período.
  const balancete = useBalancete(periodo)
  const painel = useDashboardPublico()
  const opcoes = useOpcoesDeFiltro()
  const exportar = useExportar(filtro)
  const solicitar = useSolicitarRelatorio(filtro)

  const dados = balancete.data
  const meses = dados?.meses ?? []

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do período"
        indicadores={[
          {
            rotulo: 'Entradas no período',
            valor: dados ? formatarCentavos(dados.entradas_em_centavos) : null,
            icone: ArrowUpRight,
            sinal: dados && variacao(dados.entradas_em_centavos, dados.anterior.entradas_em_centavos, true),
            nota: dados ? 'vs. período anterior' : undefined,
            serie: meses.map((mes) => mes.entradas_em_centavos),
          },
          {
            rotulo: 'Saídas no período',
            valor: dados ? formatarCentavos(dados.saidas_em_centavos) : null,
            icone: ArrowDownRight,
            sinal: dados && variacao(dados.saidas_em_centavos, dados.anterior.saidas_em_centavos, false),
            nota: dados ? 'vs. período anterior' : undefined,
            serie: meses.map((mes) => mes.saidas_em_centavos),
          },
          {
            rotulo: 'Resultado do período',
            valor: dados ? formatarCentavos(dados.saldo_do_periodo_em_centavos) : null,
            icone: Scale,
            // Sem selo: resultado cruza o zero, então percentual não diz nada, e a frase longa
            // ("saiu mais do que entrou") competia com a curva logo abaixo. O sinal de menos no
            // número e o "antes" ao lado já dizem de que lado ele está.
            nota: dados ? `antes: ${formatarCentavos(dados.anterior.resultado_em_centavos)}` : undefined,
            serie: meses.map((mes) => mes.entradas_em_centavos - mes.saidas_em_centavos),
          },
          {
            rotulo: 'Saldo em caixa hoje',
            valor: dados ? formatarCentavos(dados.saldo_acumulado_em_centavos) : null,
            icone: Wallet,
            sinal:
              dados && dados.saldo_acumulado_em_centavos < 0
                ? { texto: 'negativo', tom: 'negativo' }
                : undefined,
          },
        ]}
      />

      <FiltrosDoRelatorio
        filtro={filtro}
        opcoes={opcoes.data}
        aoMudar={(novo) => atualizar(paraUrl(novo))}
        formato={formato}
        // O recorte inteiro vai junto: `atualizar` zera a página a cada mudança, e sem ele o que
        // estava escolhido se perderia ao trocar de formato.
        aoTrocarFormato={(novo) => atualizar({ ...paraUrl(filtro), formato: novo === 'excel' ? null : novo })}
        // A planilha baixa na hora; o PDF entra na fila e é o toast que acompanha até o download.
        aoExportar={(tipo) => (formato === 'pdf' ? solicitar.mutate(tipo) : exportar.mutate(tipo))}
        ocupado={exportar.isPending || solicitar.isPending}
      />

      {balancete.isError ? <ErroDaConsulta erro={balancete.error} /> : null}
      {/* O arranjo que vem: a evolução larga e a rosca ao lado, para a tela não saltar quando o
          balancete chegar. */}
      {balancete.isPending ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <EsqueletoDeCartao className="lg:col-span-2">
            <EsqueletoDeGrafico />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDeGrafico forma="rosca" />
          </EsqueletoDeCartao>
        </div>
      ) : null}

      {dados ? (
        <div className="motion-safe:animate-entrar grid gap-5">
          {/* A evolução ocupa dois terços: são até cinco anos de meses no eixo, e a rosca precisa de
              largura para a legenda, não para o desenho. */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Cartao
              titulo="Entradas e saídas no período"
              icone={Coins}
              descricao="Mês a mês, dentro do intervalo escolhido — a soma dos meses é o total dos indicadores."
              className="min-w-0 lg:col-span-2"
            >
              {meses.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum movimento no período escolhido.</p>
              ) : (
                <GraficoDeCaixa meses={paraOGrafico(meses)} />
              )}
            </Cartao>

            <Cartao
              titulo="No que saiu"
              icone={PiggyBank}
              descricao="As saídas do período, em fatia."
              className="min-w-0 lg:grid-rows-[auto_1fr]"
            >
              {dados.saidas_por_categoria.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma saída no período escolhido.</p>
              ) : (
                <GraficoDeRosca
                  fatias={dados.saidas_por_categoria.map((linha) => ({
                    chave: linha.rotulo,
                    rotulo: linha.rotulo,
                    valor: linha.valor_em_centavos,
                  }))}
                  rotuloDoTotal="saiu"
                />
              )}
            </Cartao>
          </div>

          {/* Duas colunas, e não três: em três, o nome do fornecedor quebrava em três linhas na
              coluna estreita e o quadro de entradas — de duas linhas — deixava meia tela em branco. */}
          <div className="grid gap-5 lg:grid-cols-2">
            <QuadroDoBalancete
              titulo="Saídas por categoria"
              icone={PiggyBank}
              descricao="O que a turma pagou no período, por tipo de gasto."
              rotuloDaColuna="Categoria"
              linhas={dados.saidas_por_categoria}
            />

            <QuadroDoBalancete
              titulo="Saídas por fornecedor"
              icone={Handshake}
              descricao="As mesmas saídas, abertas por quem a turma contratou — os dois quadros somam o mesmo total."
              rotuloDaColuna="Fornecedor"
              linhas={dados.saidas_por_fornecedor}
            />

            <QuadroDoBalancete
              titulo="Entradas por tipo de cobrança"
              icone={Coins}
              descricao="O que entrou no período, pelo item de cobrança que originou a parcela."
              rotuloDaColuna="Item"
              linhas={dados.entradas}
            />

            {/* O quarto quadro fecha a grade com o número que faltava: entradas, saídas e resultado
                dizem o que aconteceu; a adimplência diz quanto do que era para ter entrado entrou.
                É o mesmo medidor do Painel de Gestão.

                Como o saldo em caixa, é de hoje e não do período — o título diz isso, para ninguém
                lê-lo como "a adimplência de março a junho". */}
            <Cartao
              titulo="Adimplência hoje"
              icone={Gauge}
              descricao="Do que já venceu, quanto entrou. Não depende do período escolhido."
              className="lg:grid-rows-[auto_1fr]"
            >
              {painel.isPending ? <EsqueletoDeGrafico forma="rosca" /> : null}
              {painel.data ? <MedidorDeAdimplencia adimplencia={painel.data.adimplencia} /> : null}
            </Cartao>
          </div>
        </div>
      ) : null}
    </>
  )
}
