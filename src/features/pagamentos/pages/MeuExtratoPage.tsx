import { Link } from 'react-router'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import mascoteLupa from '@/assets/mascote/lupa.webp'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { ROTULOS_DE_STATUS } from '@/components/ChipDeStatus'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Tabela } from '@/components/Planilha'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { emAberto, type Parcela, rotuloDoItem } from '@/types/cobranca'
import { LinhaDeParcela } from '../components/LinhaDeParcela'
import { ResumoDoExtrato } from '../components/ResumoDoExtrato'
import { useExtrato } from '../hooks/useExtrato'

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

const ehSituacao = (valor: string | null): valor is Situacao => valor !== null && valor in FILTROS

/** O que cada coluna ordenável compara. Sem coluna escolhida vale a ordem da API: por vencimento. */
const CHAVES: Record<string, (p: Parcela) => number | string> = {
  parcela: (p) => `${rotuloDoItem(p)} ${String(p.numero).padStart(4, '0')}`,
  vencimento: (p) => p.vencimento,
  valor: (p) => p.valor_pago_em_centavos ?? p.valor_do_dia?.total_em_centavos ?? p.valor_original_em_centavos,
  situacao: (p) => (p.em_conferencia && emAberto(p) ? 'Em conferência' : ROTULOS_DE_STATUS[p.status]),
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
  const extrato = useExtrato()
  const { parametros, atualizar } = useFiltrosDaUrl()

  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : undefined
  const ordenacao = useOrdenacao(atualizar)
  const todas = extrato.data?.parcelas ?? []
  const parcelas = ordenar(
    situacao ? todas.filter(FILTROS[situacao].combina) : todas,
    ordenacao.por,
    ordenacao.descendente,
  )
  const contar = (filtro: Situacao) =>
    extrato.data ? todas.filter(FILTROS[filtro].combina).length : undefined

  return (
    <>
      <ResumoDoExtrato extrato={extrato.data} />

      {todas.length > 0 ? (
        <FiltrosDaPlanilha
          principal={
            <Chip
              tom="claro"
              ativo={!situacao}
              contagem={todas.length}
              onClick={() => atualizar({ situacao: null })}
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
              onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
            >
              {rotulo}
            </Chip>
          ))}
          contagem={{ mostrando: parcelas.length, total: todas.length, unidade: 'parcelas' }}
        />
      ) : null}

      {/* Sem título nem descrição, como as listas da gestão: o `h1` da tela já diz "Minhas
          parcelas", e o passo a passo do PIX está na tela de pagamento. */}
      <Cartao rotulo="Minhas parcelas" className="px-5 py-2">
        {extrato.isPending ? <EsqueletoDeTabela linhas={5} colunas={5} /> : null}

        {extrato.isError ? <ErroDaConsulta erro={extrato.error} /> : null}

        {extrato.data && parcelas.length === 0 ? (
          <div className="motion-safe:animate-entrar grid justify-items-center gap-2 py-6 text-center">
            <img src={situacao ? mascoteLupa : mascoteCofrinho} alt="" className="w-28 drop-shadow-lg" />
            <p className="text-foreground font-medium">
              {situacao ? 'Nenhuma parcela nesta situação' : 'Nenhuma parcela ainda'}
            </p>
            <p className="text-muted-foreground text-sm">
              {situacao ? (
                'Toque em "Todas" para ver a grade inteira.'
              ) : (
                <>
                  Suas parcelas aparecem aqui quando você aderir ao{' '}
                  <Link to={ROTAS.adesao} className="text-brand-text underline-offset-4 hover:underline">
                    termo da turma
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        ) : null}

        {parcelas.length > 0 ? (
          <Tabela
            ordenacao={ordenacao}
            cabecalho={
              <>
                <ColunaOrdenavel coluna="parcela">Parcela</ColunaOrdenavel>
                <ColunaOrdenavel coluna="vencimento">Vencimento</ColunaOrdenavel>
                <ColunaOrdenavel coluna="valor" numerica>
                  Valor
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
                <th className="py-3 font-normal">
                  <span className="sr-only">Ações</span>
                </th>
              </>
            }
          >
            {parcelas.map((parcela) => (
              <LinhaDeParcela
                key={parcela.id}
                parcela={parcela}
                proxima={parcela.id === extrato.data?.proxima?.id}
              />
            ))}
          </Tabela>
        ) : null}
      </Cartao>
    </>
  )
}
