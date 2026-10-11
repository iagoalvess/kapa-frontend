import { Chip } from '@/components/Chip'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { CheckCheck, Clock, ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Paginacao } from '@/components/Paginacao'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS, rotaDaEnquete } from '@/config/rotas'
import { enquetesPendentes, useEnquetes } from '@/hooks/useEnquetes'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { paginar } from '@/lib/paginar'
import { cn } from '@/lib/utils'
import { DetalheDaEnquete } from '../components/DetalheDaEnquete'
import { FormularioDaEnquete } from '../components/FormularioDaEnquete'
import { COR_ESCOLHIDA, COR_NAO_ESCOLHIDA } from '@/components/LinhaSelecionavel'
import { Selo } from '@/components/Selo'
import { formatarDataHora } from '@/lib/formato'

/** Lista e histórico à esquerda, consulta selecionada à direita; no celular cada leitura tem sua URL. */
export default function EnquetesPage() {
  const { id } = useParams()
  const consulta = useEnquetes()
  const filtros = useFiltrosDaUrl()
  const tamanho = useTamanhoDaPagina()
  const navegar = useNavigate()
  const gestao = usePapel().tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const escrita = useEscritaLiberada()
  const [criando, criar] = useState(false)
  const situacao = filtros.parametros.get('situacao') ?? ''
  const lista = consulta.data ?? []
  const precisaAceitarTermo = lista.some(
    (enquete) =>
      enquete.situacao === 'Aberta' &&
      !enquete.pode_responder &&
      enquete.motivo_do_bloqueio?.includes('termo'),
  )
  const pagina = paginar(
    lista.filter(
      (e) =>
        (!situacao || e.situacao === situacao) &&
        e.pergunta.toLocaleLowerCase('pt-BR').includes(filtros.busca.toLocaleLowerCase('pt-BR')),
    ),
    filtros.pagina,
    tamanho,
  )
  const selecionada = id ?? pagina.visiveis[0]?.id
  return (
    <div className="grid gap-5">
      {id ? (
        <LinkDeVolta para={ROTAS.enquetes} className="lg:hidden">
          Enquetes
        </LinkDeVolta>
      ) : null}
      <div className={cn('grid gap-5', id && 'max-lg:hidden')}>
        <FaixaDeIndicadores
          rotulo="Resumo das enquetes"
          indicadores={[
            {
              rotulo: 'Abertas',
              valor: consulta.data ? lista.filter((e) => e.situacao === 'Aberta').length : null,
              icone: Clock,
            },
            {
              rotulo: 'Para responder',
              valor: consulta.data ? enquetesPendentes(lista).length : null,
              icone: ListChecks,
            },
            {
              rotulo: 'Encerradas',
              valor: consulta.data ? lista.filter((e) => e.situacao === 'Encerrada').length : null,
              icone: CheckCheck,
            },
          ]}
        />
        <FiltrosDaPlanilha
          principal={
            <Chip
              tom="claro"
              ativo={!situacao}
              contagem={consulta.data ? lista.length : undefined}
              onClick={() => filtros.atualizar({ situacao: null })}
            >
              Todas
            </Chip>
          }
          legenda="Situação"
          filtros={(
            [
              { valor: 'Aberta', rotulo: 'Abertas' },
              { valor: 'Encerrada', rotulo: 'Encerradas' },
              { valor: 'Cancelada', rotulo: 'Canceladas' },
            ] as const
          ).map((filtro) => (
            <Chip
              key={filtro.valor}
              tom="escuro"
              ativo={situacao === filtro.valor}
              contagem={consulta.data ? lista.filter((e) => e.situacao === filtro.valor).length : undefined}
              onClick={() => filtros.atualizar({ situacao: situacao === filtro.valor ? null : filtro.valor })}
            >
              {filtro.rotulo}
            </Chip>
          ))}
          busca={{
            valor: filtros.busca,
            rotulo: 'Buscar enquetes',
            aoBuscar: (termo) => filtros.atualizar({ busca: termo }),
          }}
          acaoPrincipal={
            gestao ? (
              <Button size="xs" disabled={!escrita} onClick={() => criar(true)}>
                <Plus aria-hidden />
                Nova enquete
              </Button>
            ) : null
          }
          contagem={{ mostrando: pagina.visiveis.length, total: pagina.total, unidade: 'enquetes' }}
          nota={
            precisaAceitarTermo ? (
              <LinkDaPagina to={ROTAS.adesao} className="underline underline-offset-2">
                Aceite o termo para votar.
              </LinkDaPagina>
            ) : null
          }
        />
      </div>
      {consulta.isError ? (
        <ErroDaConsulta erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <EsqueletoDeCartao />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className={cn('grid gap-3', id && 'max-lg:hidden')}>
            <Cartao rotulo="Enquetes da turma" className="gap-0 overflow-hidden p-0">
              <nav aria-label="Lista de enquetes">
                {pagina.visiveis.length ? (
                  <ul className="divide-y">
                    {pagina.visiveis.map((e) => (
                      <li key={e.id}>
                        <Link
                          to={rotaDaEnquete(e.id) + (filtros.parametros.size ? '?' + filtros.parametros : '')}
                          aria-current={selecionada === e.id ? 'page' : undefined}
                          className={cn(
                            'focus-visible:outline-ring grid gap-2 border-l-2 px-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2',
                            selecionada === e.id ? COR_ESCOLHIDA : COR_NAO_ESCOLHIDA,
                          )}
                        >
                          <h3 className="text-sm leading-snug font-medium">{e.pergunta}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Selo tom={e.situacao === 'Aberta' ? 'sucesso' : 'neutro'}>{e.situacao}</Selo>
                            {e.minha_resposta ? (
                              <span className="text-muted-foreground">Você respondeu</span>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {e.situacao === 'Aberta' ? 'Encerra' : 'Prazo'}: {formatarDataHora(e.encerra_em)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground p-5 text-sm">
                    {filtros.busca || situacao
                      ? 'Nenhuma enquete encontrada. Ajuste os filtros.'
                      : 'Nenhuma enquete publicada. As consultas da comissão aparecerão aqui.'}
                  </p>
                )}
              </nav>
              {pagina.totalPaginas > 1 ? (
                <div className="border-t px-4 py-3">
                  <Paginacao {...pagina} aoMudar={(p) => filtros.atualizar({ pagina: String(p) })} />
                </div>
              ) : null}
            </Cartao>
          </div>
          <div className={cn('min-w-0', !id && 'max-lg:hidden')}>
            {selecionada ? <DetalheDaEnquete key={selecionada} id={selecionada} /> : null}
          </div>
        </div>
      )}
      {criando ? (
        <FormularioDaEnquete
          aoFechar={() => criar(false)}
          aoSalvar={(salva) => {
            criar(false)
            navegar(rotaDaEnquete(salva))
          }}
        />
      ) : null}
    </div>
  )
}
