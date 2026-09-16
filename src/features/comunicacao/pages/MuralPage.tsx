import { Clock, Megaphone, Pin, Plus, Star } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import mascoteLendo from '@/assets/mascote/lendo.webp'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Cartao } from '@/components/Cartao'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo, faixasDePublicacao } from '@/components/FiltroDePeriodo'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Paginacao } from '@/components/Paginacao'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS, rotaDoAviso } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarDataRelativa } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { DetalheDoAviso } from '../components/DetalheDoAviso'
import { EditorDeAviso } from '../components/EditorDeAviso'
import { LinhaDoMural } from '../components/LinhaDoMural'
import { useAviso, useAvisos, useResumoDoMural } from '../hooks/useAvisos'
import { LIMITE_DE_FIXADOS, type ResumoDoMural } from '../types/comunicacao.types'

const TAMANHO_DA_PAGINA = 20

/**
 * Os filtros da lista: o que vai na URL, o rótulo da pílula, o que se pede à API e de onde sai a
 * contagem. `internos` só existe para a Gestão — para o formando, o aviso interno não chega nem na
 * lista nem no resumo.
 */
const FILTROS = {
  todos: { rotulo: 'Todos', query: {}, contar: (r: ResumoDoMural) => r.quantidade },
  fixados: { rotulo: 'Fixados', query: { fixado: true }, contar: (r: ResumoDoMural) => r.fixados },
  importantes: {
    rotulo: 'Importantes',
    query: { destaque: true },
    contar: (r: ResumoDoMural) => r.importantes,
  },
  internos: {
    rotulo: 'Só comissão',
    query: { visibilidade: 'SomenteComissao' },
    contar: (r: ResumoDoMural) => r.internos,
  },
} as const satisfies Record<
  string,
  { rotulo: string; query: object; contar: (resumo: ResumoDoMural) => number }
>

type Filtro = keyof typeof FILTROS

const ehFiltro = (valor: string | null): valor is Filtro => valor !== null && valor in FILTROS

/**
 * O mural da turma: a lista dos comunicados à esquerda, o aviso aberto à direita.
 *
 * A rota é a seleção: `/mural/:id` abre aquele aviso, e `/mural` abre o primeiro da lista — assim o
 * link de um aviso continua sendo um link, e voltar no histórico volta a leitura. No celular não há
 * as duas colunas: sem id é a lista, com id é o aviso, com um "Mural" para voltar.
 *
 * Busca, filtro e página vivem na URL, como nas demais listas. As contagens das pílulas e os
 * indicadores vêm do `/avisos/resumo`, que é o total de cada filtro — e não o da página à vista.
 *
 * O que cada um lê a API já recortou: o formando nunca recebe o aviso só da comissão, nem o vê na
 * contagem.
 */
export default function MuralPage() {
  const { id } = useParams()
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const navegar = useNavigate()
  const { tem } = usePapel()
  const gestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const editavel = useEscritaLiberada()

  const filtroNaUrl = parametros.get('filtro')
  const filtro: Filtro =
    ehFiltro(filtroNaUrl) && (filtroNaUrl !== 'internos' || gestao) ? filtroNaUrl : 'todos'

  const de = parametros.get('de') ?? undefined
  const ate = parametros.get('ate') ?? undefined

  const avisos = useAvisos({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    busca: busca || undefined,
    de,
    ate,
    ...FILTROS[filtro].query,
  })
  const resumo = useResumoDoMural()
  const itens = avisos.data?.itens ?? []

  // Sem id na rota, o primeiro da lista é o que abre — o mural nunca fica com a direita vazia.
  const escolhido = id ?? itens[0]?.id
  // O aviso escolhido quase sempre está na página que já veio; só o link direto para um aviso fora
  // dela (outro filtro, outra página) precisa da consulta pelo id.
  const naLista = itens.find((aviso) => aviso.id === escolhido)
  const umAviso = useAviso(naLista ? '' : (escolhido ?? ''))
  const aberto = naLista ?? umAviso.data

  const escrevendo = gestao && parametros.get('novo') === '1'
  const corrigindo = gestao && parametros.get('editar') === '1' ? aberto : undefined

  // O editor toma a tela inteira: markdown e prévia lado a lado não cabem em dois terços dela.
  if (escrevendo || corrigindo) {
    return (
      <EditorDeAviso
        aviso={corrigindo}
        aoCancelar={() => atualizar({ novo: null, editar: null, pagina: String(pagina) })}
        aoConcluir={(aviso) => navegar(rotaDoAviso(aviso.id))}
      />
    )
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do mural"
        indicadores={[
          { rotulo: 'Avisos publicados', valor: resumo.data?.quantidade ?? null, icone: Megaphone },
          { rotulo: 'Importantes', valor: resumo.data?.importantes ?? null, icone: Star },
          {
            rotulo: 'Fixados',
            valor: resumo.data?.fixados ?? null,
            unidade: `de ${LIMITE_DE_FIXADOS}`,
            icone: Pin,
          },
          {
            rotulo: 'Último aviso',
            valor: resumo.data
              ? resumo.data.ultima_publicacao
                ? formatarDataRelativa(resumo.data.ultima_publicacao)
                : 'Nenhum'
              : null,
            icone: Clock,
          },
        ]}
      />

      {/* Os filtros ficam acima das duas colunas, como em Membros e Despesas: é a lista inteira que
          eles recortam, e não o cartão da esquerda. No celular somem junto com a lista. */}
      <div className={cn(id && 'max-lg:hidden')}>
        <FiltrosDaPlanilha
          principal={
            <PilulaDoFiltro valor="todos" filtro={filtro} resumo={resumo.data} aoTrocar={atualizar} />
          }
          legenda="Destaque"
          filtros={(['fixados', 'importantes', 'internos'] as const)
            .filter((valor) => valor !== 'internos' || gestao)
            .map((valor) => (
              <PilulaDoFiltro
                key={valor}
                valor={valor}
                filtro={filtro}
                resumo={resumo.data}
                aoTrocar={atualizar}
              />
            ))}
          busca={{ valor: busca, rotulo: 'Buscar aviso', aoBuscar: (termo) => atualizar({ busca: termo }) }}
          acoes={
            <>
              <BotaoDeFiltros id="filtros-do-mural" ligados={de || ate ? 1 : 0}>
                <FiltroDePeriodo
                  legenda="Publicação"
                  faixas={faixasDePublicacao()}
                  de={de}
                  ate={ate}
                  aoMudar={atualizar}
                />
              </BotaoDeFiltros>
              {gestao ? (
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!editavel}
                  onClick={() => atualizar({ novo: '1' })}
                >
                  <Plus aria-hidden />
                  Novo aviso
                </Button>
              ) : null}
            </>
          }
          contagem={{ mostrando: itens.length, total: avisos.data?.total ?? 0, unidade: 'avisos' }}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Cartao
          rotulo="Avisos"
          // O cartão da lista não leva o respiro dos outros: as linhas encostam na borda.
          className={cn('gap-0 overflow-hidden p-0', id && 'max-lg:hidden')}
        >
          {avisos.isPending ? <EsqueletoDeTexto linhas={6} className="p-4" /> : null}
          {avisos.isError ? <ErroDaConsulta erro={avisos.error} /> : null}

          {avisos.data && itens.length === 0 ? (
            <MuralVazio filtrado={!!busca || !!de || filtro !== 'todos'} gestao={gestao} />
          ) : null}

          {itens.length > 0 ? (
            <ul className="divide-y">
              {itens.map((aviso) => (
                <LinhaDoMural key={aviso.id} aviso={aviso} aberto={aviso.id === escolhido} />
              ))}
            </ul>
          ) : null}

          {avisos.data && avisos.data.total_paginas > 1 ? (
            <div className="border-t px-4 pb-4">
              <Paginacao
                pagina={avisos.data.pagina}
                totalPaginas={avisos.data.total_paginas}
                total={avisos.data.total}
                ocupado={avisos.isPlaceholderData}
                aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
              />
            </div>
          ) : null}
        </Cartao>

        <div className={cn('grid min-w-0 gap-3', !id && 'max-lg:hidden')}>
          {/* Só no celular: no desktop a lista está ao lado, e não há de onde voltar. */}
          <LinkDeVolta para={ROTAS.mural} className="lg:hidden">
            Mural
          </LinkDeVolta>

          {aberto ? <DetalheDoAviso aviso={aberto} gestao={gestao} /> : null}
          {!aberto && umAviso.isPending ? <EsqueletoDeCartao /> : null}
          {/* Link direto para um aviso que não existe mais — ou que é só da comissão, e a API
              responde 404 sem confirmar que ele existe. */}
          {!aberto && umAviso.isError ? (
            <Cartao titulo="Aviso não encontrado">
              <p role="alert" className="text-muted-foreground text-sm">
                Ele pode ter sido excluído pela comissão. Escolha um da lista.
              </p>
            </Cartao>
          ) : null}
        </div>
      </div>
    </>
  )
}

/**
 * Uma pílula de filtro, com a contagem que o resumo dá para ela.
 *
 * "Todos" fica na linha de cima, em cinza: é tirar o filtro, e não deve competir com os de verdade,
 * que acendem embaixo — a mesma escada de Membros e Despesas. Clicar no que já está ligado desliga.
 */
function PilulaDoFiltro({
  valor,
  filtro,
  resumo,
  aoTrocar,
}: {
  valor: Filtro
  filtro: Filtro
  resumo?: ResumoDoMural
  aoTrocar: (mudancas: Record<string, string | null>) => void
}) {
  const { rotulo, contar } = FILTROS[valor]

  return (
    <Chip
      tom={valor === 'todos' ? 'claro' : 'escuro'}
      ativo={filtro === valor}
      contagem={resumo ? contar(resumo) : undefined}
      onClick={() => aoTrocar({ filtro: valor === 'todos' || filtro === valor ? null : valor })}
    >
      {rotulo}
    </Chip>
  )
}

/** A lista sem nada: turma sem aviso nenhum, ou filtro que não achou. */
function MuralVazio({ filtrado, gestao }: { filtrado: boolean; gestao: boolean }) {
  return (
    <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
      <img src={mascoteLendo} alt="" className="w-24 drop-shadow-lg" />
      <p className="text-foreground text-sm font-medium">
        {filtrado ? 'Nenhum aviso encontrado' : 'Nenhum aviso ainda'}
      </p>
      <p className="text-muted-foreground text-xs">
        {filtrado
          ? 'Tente outra busca ou tire o filtro.'
          : gestao
            ? 'Publique o primeiro: reunião, prazo, contrato fechado — o que não pode se perder no grupo.'
            : 'Quando a comissão publicar um comunicado, ele aparece aqui.'}
      </p>
    </div>
  )
}
