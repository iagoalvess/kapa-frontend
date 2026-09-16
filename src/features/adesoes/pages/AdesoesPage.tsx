import { ChartPie, Eye, FilePenLine, ScrollText, UserCheck, UserRoundX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EsqueletoDeCartao, EsqueletoDeCartoes, EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { EditorDoTermo } from '../components/TermoDaTurma'
import { PainelDeAdesoes } from '../components/PainelDeAdesoes'
import { useResumoDeAdesoes } from '../hooks/usePainel'
import { useConteudoParaAdesao } from '../hooks/useTermo'

/**
 * As adesões da turma, para a gestão, no mesmo desenho da tela de membros: os números no topo —
 * "62 de 80 aderiram" é o que a comissão olha toda semana —, os filtros e a busca numa linha, e a
 * lista ocupando a largura toda. O termo não tem cartão: mora nos indicadores, e as suas duas ações
 * ficam na linha da busca.
 *
 * O Presidente escreve o termo aqui mesmo: sem versão publicada, o editor abre sozinho; com ela,
 * "Publicar nova versão" o abre (`?editar=termo`, na URL, para o recarregar não perder o lugar).
 */
export default function AdesoesPage() {
  const { ehPresidente, tem } = usePapel()
  const liberado = useEscritaLiberada()
  const resumo = useResumoDeAdesoes()
  const conteudo = useConteudoParaAdesao()
  const [parametros, definirParametros] = useSearchParams()

  // A faixa de números e a lista de quem aderiu, o desenho que vem.
  if (conteudo.isPending)
    return (
      <>
        <EsqueletoDeCartoes quantidade={1} altura="h-32" className="md:grid-cols-1" />
        <EsqueletoDeCartao>
          <EsqueletoDeTabela colunas={5} />
        </EsqueletoDeCartao>
      </>
    )

  if (conteudo.isError) return <ErroDaConsulta erro={conteudo.error} />

  const { termo, plano } = conteudo.data
  // Turma fora de Ativa é leitura: o editor nem abre, e a faixa de aviso diz por quê.
  const editando = ehPresidente && liberado && (!termo || parametros.get('editar') === 'termo')
  const faltam = resumo.data ? resumo.data.membros - resumo.data.aderiram : null
  /** Abre ou fecha o editor sem mexer nos filtros do painel, que moram na mesma URL. */
  const editor = (aberto: boolean) =>
    definirParametros((atuais) => {
      const proximos = new URLSearchParams(atuais)
      if (aberto) proximos.set('editar', 'termo')
      else proximos.delete('editar')
      return proximos
    })

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das adesões"
        indicadores={[
          {
            rotulo: 'Aderiram',
            valor: resumo.data?.aderiram ?? null,
            unidade: resumo.data ? `de ${formatarNumero(resumo.data.membros)}` : undefined,
            icone: UserCheck,
          },
          {
            rotulo: 'Faltam aderir',
            valor: faltam,
            icone: UserRoundX,
            sinal: faltam && termo ? { texto: 'lembrar', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'Adesão da turma',
            valor: resumo.data?.membros
              ? `${formatarNumero((resumo.data.aderiram / resumo.data.membros) * 100)}%`
              : null,
            icone: ChartPie,
          },
          {
            rotulo: termo ? `Termo vigente · desde ${formatarData(termo.vigente_desde)}` : 'Termo vigente',
            valor: termo ? `Versão ${termo.versao}` : 'Não publicado',
            icone: ScrollText,
          },
        ]}
      />

      {/* Os dois bloqueios da tela, em faixa: sem plano ou sem termo, ninguém consegue aderir. */}
      {plano ? null : (
        <Aviso>
          A turma ainda não tem plano de cobrança em vigor — sem ele, ninguém consegue aderir.{' '}
          {tem(PAPEIS.tesoureiro) ? (
            <Link to={ROTAS.cobrancas} className="font-medium underline">
              Montar o plano
            </Link>
          ) : null}
        </Aviso>
      )}

      {termo || editando ? null : (
        <Aviso>
          A turma ainda não tem termo publicado — sem ele, ninguém consegue aderir.{' '}
          {ehPresidente
            ? 'Com a turma fora de Ativa, o termo não pode ser publicado.'
            : 'Quem publica o termo é o Presidente.'}
        </Aviso>
      )}

      {/* Escrevendo o termo, a tela é só o editor: a lista de quem aderiu não ajuda em nada aqui. */}
      {editando ? (
        <EditorDoTermo
          key={termo?.id ?? 'primeira'}
          vigente={termo}
          aoConcluir={termo ? () => editor(false) : undefined}
        />
      ) : (
        <PainelDeAdesoes
          resumo={resumo.data}
          versaoVigente={termo?.versao}
          acoes={
            <>
              {termo ? (
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link to={ROTAS.adesao} title="A tela do formando, com a versão vigente do termo">
                    <Eye aria-hidden />
                    Visualizar
                  </Link>
                </Button>
              ) : null}

              {ehPresidente && termo ? (
                <Button size="sm" className="h-8" disabled={!liberado} onClick={() => editor(true)}>
                  <FilePenLine aria-hidden />
                  Publicar nova versão
                </Button>
              ) : null}
            </>
          }
        />
      )}
    </>
  )
}

/** Faixa de bloqueio da tela, largura toda, logo abaixo dos indicadores. */
function Aviso({ children }: { children: ReactNode }) {
  return <p className="bg-warning-bg text-warning-text rounded-2xl px-4 py-3 text-sm">{children}</p>
}
