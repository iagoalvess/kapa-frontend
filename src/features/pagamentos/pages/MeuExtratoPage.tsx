import { LinkDaPagina } from '@/components/LinkDaPagina'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { ROTULOS_DE_STATUS } from '@/components/ChipDeStatus'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FiltroDePeriodo } from '@/components/FiltroDePeriodo'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { ColunaOrdenavel, Tabela } from '@/components/Planilha'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { aPagar, emAberto, type Parcela, rotuloDoItem, valorNaLista } from '@/types/cobranca'
import { DialogoDeEscolhaDeParcelas } from '../components/DialogoDeEscolhaDeParcelas'
import { LateralDoExtrato } from '../components/LateralDoExtrato'
import { LinhaDeParcela } from '../components/LinhaDeParcela'
import { ResumoDoExtrato } from '../components/ResumoDoExtrato'
import { useExtrato } from '../hooks/useExtrato'
import { ehOpcao } from '@/lib/opcao'
import { contemBusca } from '@/lib/busca'
import { ehDia } from '@/lib/formato'
import { paginar } from '@/lib/paginar'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

/**
 * As pílulas de situação, como as de Parcelas e Membros. "Em conferência" é uma leitura, e não um
 * status: convive com A vencer e Vencidas, e por isso entra como filtro próprio.
 */
const FILTROS = {
  'a-vencer': { rotulo: 'A vencer', combina: (p: Parcela) => p.status === 'Aberta' },
  vencidas: { rotulo: 'Vencidas', combina: (p: Parcela) => p.status === 'Vencida' },
  pagas: { rotulo: 'Pagas', combina: (p: Parcela) => p.status === 'Paga' },
  conferencia: { rotulo: 'Em conferência', combina: (p: Parcela) => p.em_conferencia },
} as const

type Situacao = keyof typeof FILTROS

const ehSituacao = (valor: string | null): valor is Situacao => ehOpcao(valor, FILTROS)

/** O que cada coluna ordenável compara. Sem coluna escolhida vale a ordem da API: por vencimento. */
const CHAVES: Record<string, (p: Parcela) => number | string> = {
  parcela: (p) => `${rotuloDoItem(p)} ${String(p.numero).padStart(4, '0')}`,
  vencimento: (p) => p.vencimento,
  valor: (p) => valorNaLista(p),
  situacao: (p) => (p.em_conferencia && emAberto(p) ? 'Em conferência' : ROTULOS_DE_STATUS[p.status]),
}

/**
 * Se a parcela casa com o que foi digitado.
 *
 * Busca **na tela**, e não na API: o extrato vem inteiro numa consulta só — é a grade de um
 * formando — e um `?busca=` no servidor só acrescentaria uma ida à rede para filtrar o que já está
 * na memória. Compara sem acento, como o resto do produto: quem procura "adesao" acha "Adesão".
 *
 * @param termo O que a pessoa digitou; vazio deixa tudo passar.
 */
function combina(parcela: Parcela, termo: string) {
  return contemBusca(termo, `${rotuloDoItem(parcela)} ${parcela.numero}/${parcela.de}`)
}

/** `toSorted` porque a lista é do cache do React Query: ordenar no lugar mexeria no cache. */
function ordenar(parcelas: Parcela[], por: string | undefined, descendente: boolean) {
  const chave = por ? CHAVES[por] : undefined
  if (!chave) return parcelas

  return parcelas.toSorted((a, b) => {
    const [x, y] = [chave(a), chave(b)]
    const ordem = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))

    return descendente ? -ordem : ordem
  })
}

/**
 * O extrato do próprio membro — a tela mais acessada do produto, e aberta no celular, no ônibus.
 *
 * Na ordem da Sprint 9: quanto falta e quando é a próxima, e depois a grade inteira. A vencida já
 * vem com multa e juros, e a conta abre ao tocar. "Em conferência" é a parcela que o formando
 * avisou e a tesouraria ainda não conferiu — leitura, não status.
 *
 * Situação vive na URL, como nas listas da gestão. O filtro é aqui mesmo: o extrato vem inteiro
 * numa consulta só (é a grade de um formando), e um `?situacao=` na API não traria nada de novo.
 */
export default function MeuExtratoPage() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const extrato = useExtrato()
  const { parametros, pagina: paginaNaUrl, busca, atualizar } = useFiltrosDaUrl()

  const situacaoNaUrl = parametros.get('situacao')
  // Sem `?situacao=` a tela abre no que ainda vai vencer — é o que o formando vem ver. Por isso
  // "Todas" é explícito na URL: apagar o parâmetro voltaria ao padrão no F5.
  const situacao = ehSituacao(situacaoNaUrl)
    ? situacaoNaUrl
    : situacaoNaUrl === 'todas'
      ? undefined
      : 'a-vencer'
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const noPeriodo = (parcela: Parcela) =>
    (!de || parcela.vencimento >= de) && (!ate || parcela.vencimento <= ate)
  const ordenacao = useOrdenacao(atualizar)
  const todas = extrato.data?.parcelas ?? []
  const parcelas = ordenar(
    todas.filter(
      (parcela) =>
        (situacao ? FILTROS[situacao].combina(parcela) : true) &&
        noPeriodo(parcela) &&
        combina(parcela, busca),
    ),
    ordenacao.por,
    ordenacao.descendente,
  )
  const pagina = paginar(parcelas, paginaNaUrl, tamanhoDaPagina)
  // Quem não tem parcela nenhuma vê uma coisa; quem recortou a lista, outra. Como a tela já abre
  // filtrada, ter parcela e não ver nenhuma é sempre recorte.
  const recortando = todas.length > 0
  const periodoAtivo = Boolean(de || ate)
  const contar = (filtro: Situacao) =>
    extrato.data ? todas.filter(FILTROS[filtro].combina).length : undefined

  return (
    <>
      <ResumoDoExtrato extrato={extrato.data} />

      {todas.length > 0 ? (
        <FiltrosDaPlanilha
          acaoPrincipal={<DialogoDeEscolhaDeParcelas parcelas={todas.filter(aPagar)} />}
          busca={{
            valor: busca,
            rotulo: 'Buscar parcela',
            aoBuscar: (termo) => atualizar({ busca: termo }),
          }}
          filtrosAvancados={
            <BotaoDeFiltros id="filtros-do-extrato" ligados={de || ate ? 1 : 0}>
              <FiltroDePeriodo de={de} ate={ate} aoMudar={atualizar} />
            </BotaoDeFiltros>
          }
          principal={
            <Chip
              tom="claro"
              ativo={!situacao}
              contagem={todas.length}
              onClick={() => atualizar({ situacao: 'todas' })}
            >
              Todas
            </Chip>
          }
          legenda="Situação"
          filtros={Object.entries(FILTROS).map(([valor, { rotulo }]) => (
            <Chip
              key={valor}
              ativo={situacao === valor}
              contagem={contar(valor as Situacao)}
              onClick={() => atualizar({ situacao: situacao === valor ? 'todas' : valor })}
            >
              {rotulo}
            </Chip>
          ))}
          contagem={{ mostrando: parcelas.length, total: todas.length, unidade: 'parcelas' }}
        />
      ) : null}

      {/* Sem título nem descrição, como as listas da gestão: o `h1` da tela já diz "Minhas
          parcelas", e o passo a passo do PIX está na tela de pagamento. */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Cartao rotulo="Minhas parcelas" className="min-w-0 px-5 py-2">
          {extrato.isPending ? <EsqueletoDeTabela linhas={5} colunas={5} /> : null}

          {extrato.isError ? <ErroDaConsulta erro={extrato.error} /> : null}

          {extrato.data && parcelas.length === 0 ? (
            // Três vazios diferentes: quem nunca teve parcela, quem filtrou e quem procurou. Dizer
            // "aparecem quando você aderir" a quem só digitou um termo é responder outra coisa.
            <ListaVazia
              mascote={recortando ? undefined : mascoteCofrinho}
              titulo={
                busca
                  ? `Nada encontrado para “${busca}”`
                  : recortando
                    ? periodoAtivo
                      ? 'Nenhuma parcela neste período'
                      : 'Nenhuma parcela nesta situação'
                    : 'Nenhuma parcela ainda'
              }
              dica={
                busca ? (
                  'Procure pelo nome da cobrança — "mensalidade", "rifa" — ou limpe a busca.'
                ) : recortando ? (
                  periodoAtivo ? (
                    'Tire o período no botão Filtros para ver a grade inteira.'
                  ) : (
                    'Toque em "Todas" para ver a grade inteira.'
                  )
                ) : (
                  <>
                    Suas parcelas aparecem aqui quando você aderir ao{' '}
                    <LinkDaPagina
                      to={ROTAS.adesao}
                      className="text-brand-text underline-offset-4 hover:underline"
                    >
                      termo da turma
                    </LinkDaPagina>
                    .
                  </>
                )
              }
            />
          ) : null}

          {parcelas.length > 0 ? (
            <>
              <Tabela
                emLista
                ordenacao={ordenacao}
                cabecalho={
                  <>
                    <ColunaOrdenavel coluna="parcela">Parcela</ColunaOrdenavel>
                    <ColunaOrdenavel coluna="vencimento">Vencimento</ColunaOrdenavel>
                    <ColunaOrdenavel coluna="valor" numerica>
                      Valor
                    </ColunaOrdenavel>
                    <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
                  </>
                }
              >
                {pagina.visiveis.map((parcela) => (
                  <LinhaDeParcela key={parcela.id} parcela={parcela} />
                ))}
              </Tabela>
              <Paginacao
                pagina={pagina.pagina}
                totalPaginas={pagina.totalPaginas}
                total={pagina.total}
                aoMudar={(numero) => atualizar({ pagina: String(numero) })}
              />
            </>
          ) : null}
        </Cartao>

        {extrato.data ? <LateralDoExtrato extrato={extrato.data} /> : null}
      </div>
    </>
  )
}
