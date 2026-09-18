import { CalendarClock, Clock, ScrollText, UserRoundCheck } from 'lucide-react'
import mascoteLupa from '@/assets/mascote/lupa.webp'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { type Indicador, FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Paginacao } from '@/components/Paginacao'
import { SeletorDeFiltro } from '@/components/SeletorDeFiltro'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { formatarDataRelativa, formatarNumero } from '@/lib/formato'
import { FiltroDeAuditoria } from '../components/FiltroDeAuditoria'
import { LinhaDeAuditoria } from '../components/LinhaDeAuditoria'
import { useAuditoria, useOpcoesDeAuditoria, useResumoDeAuditoria } from '../hooks/useAuditoria'
import { type ResumoDaAuditoria, rotuloDoEvento } from '../types/auditoria.types'

const TAMANHO_DA_PAGINA = 20

/**
 * Os quatro números do topo, na ordem em que a assembleia pergunta: o tamanho da trilha, o
 * movimento recente, quando foi a última coisa e de quem é a maior parte dela.
 *
 * Trilha vazia não vira zero em toda parte: "quem mais fez" e "última ação" ficam com um traço,
 * porque ninguém fez nada — e "0 ações de fulano" seria uma frase sobre uma pessoa que não existe.
 *
 * @param resumo O resumo da API; ausente enquanto a consulta não volta, e aí cada valor é `null`,
 * que é o que a faixa desenha como esqueleto.
 */
function indicadores(resumo: ResumoDaAuditoria | undefined): Indicador[] {
  const vazia = resumo?.total === 0

  return [
    {
      rotulo: 'Ações registradas',
      valor: resumo?.total ?? null,
      unidade: 'no total',
      icone: ScrollText,
      nota: resumo?.acao_mais_comum
        ? `Mais comum: ${rotuloDoEvento(resumo.acao_mais_comum.rotulo)}`
        : undefined,
    },
    {
      rotulo: 'Nos últimos 30 dias',
      valor: resumo?.nos_ultimos_trinta_dias ?? null,
      unidade: 'ações',
      icone: CalendarClock,
    },
    {
      rotulo: 'Última ação',
      valor: resumo ? (resumo.ultima_em ? formatarDataRelativa(resumo.ultima_em) : '—') : null,
      icone: Clock,
      nota: resumo?.ultimo_nome ? rotuloDoEvento(resumo.ultimo_nome) : undefined,
    },
    {
      rotulo: 'Quem mais fez',
      valor: resumo ? (resumo.quem_mais_fez?.rotulo ?? (vazia ? '—' : 'Sistema')) : null,
      icone: UserRoundCheck,
      nota: resumo?.quem_mais_fez
        ? `${formatarNumero(resumo.quem_mais_fez.quantidade)} de ${formatarNumero(resumo.total)} ações`
        : undefined,
    },
  ]
}

/**
 * A trilha de auditoria da turma: quem fez o quê com o dinheiro, quando, e o que mudou.
 *
 * Existe para a assembleia poder perguntar "quem baixou esta parcela sem comprovante?" e obter a
 * resposta na hora — e é por isso que ela é uma linha do tempo aberta, e não uma tabela com "ver
 * detalhes" em cada linha: quem varre com o olho procura o que está estranho, e o estranho está no
 * corpo do evento.
 *
 * A busca é por nome de pessoa — de quem fez ou de quem sofreu a operação — e por qualquer texto do
 * corpo do evento. Ela existe porque os dois seletores respondem "quem fez" e "o quê", e a pergunta
 * que sobrava é a terceira: "o que aconteceu com o fulano".
 *
 * Só leitura, e só da Gestão. Não há ação nenhuma nesta tela, de propósito: auditoria com botão é
 * auditoria que alguém edita.
 */
export default function AuditoriaPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()

  const filtro = {
    de: parametros.get('de') ?? undefined,
    ate: parametros.get('ate') ?? undefined,
    autor: parametros.get('autor') ?? undefined,
    nome: parametros.get('nome') ?? undefined,
    busca: busca || undefined,
  }

  const trilha = useAuditoria({ pagina, tamanho: TAMANHO_DA_PAGINA }, filtro)
  const opcoes = useOpcoesDeAuditoria()
  const resumo = useResumoDeAuditoria()

  const itens = trilha.data?.itens ?? []
  const semFiltro = !filtro.de && !filtro.ate && !filtro.autor && !filtro.nome && !filtro.busca

  return (
    <>
      <FaixaDeIndicadores rotulo="Resumo da trilha" indicadores={indicadores(resumo.data)} />
      <FiltrosDaPlanilha
        principal={
          <Chip
            ativo={semFiltro}
            tom="claro"
            onClick={() => atualizar({ de: null, ate: null, autor: null, nome: null, busca: null })}
          >
            Tudo
          </Chip>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar na trilha',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        legenda="Quem e o quê"
        filtros={
          <>
            {/* As duas listas ficam à vista, e não no painel: "o que o fulano fez" e "quem baixou
                parcela" são as perguntas da assembleia, e o painel as escondia atrás de um clique.
                No botão sobra o período, que é o recorte que já se lê na contagem ao lado. */}
            <SeletorDeFiltro
              rotulo="Quem fez"
              todos="Qualquer pessoa"
              valor={filtro.autor}
              opcoes={(opcoes.data?.autores ?? []).map((pessoa) => ({
                id: pessoa.usuario_id,
                nome: pessoa.nome,
              }))}
              aoMudar={(id) => atualizar({ autor: id ?? null })}
            />

            <SeletorDeFiltro
              rotulo="O que aconteceu"
              todos="Qualquer ação"
              valor={filtro.nome}
              opcoes={(opcoes.data?.nomes ?? []).map((evento) => ({
                id: evento,
                nome: rotuloDoEvento(evento),
              }))}
              aoMudar={(nome) => atualizar({ nome: nome ?? null })}
            />
          </>
        }
        acoes={<FiltroDeAuditoria de={filtro.de} ate={filtro.ate} aoMudar={atualizar} />}
        contagem={
          trilha.data
            ? { mostrando: itens.length, total: trilha.data.total, unidade: 'registros' }
            : undefined
        }
      />

      <Cartao
        rotulo="Trilha de auditoria"
        descricao="Cada operação que muda dinheiro, permissão ou registro da turma deixa uma linha aqui. Nada nesta lista pode ser editado ou apagado."
        titulo="O que aconteceu na turma"
      >
        {trilha.isPending ? <EsqueletoDeDados linhas={6} /> : null}

        {trilha.isError ? <ErroDaConsulta erro={trilha.error} /> : null}

        {trilha.data && itens.length === 0 ? (
          <div className="motion-safe:animate-entrar grid justify-items-center gap-2 py-8 text-center">
            <img src={mascoteLupa} alt="" className="w-28 drop-shadow-lg" />
            <p className="text-foreground font-medium">
              {semFiltro ? 'Nada registrado ainda' : 'Nenhum registro com esse filtro'}
            </p>
            <p className="text-muted-foreground text-sm">
              {semFiltro
                ? 'Baixa de parcela, troca da chave PIX, mudança de papel e exclusão de aviso aparecem aqui assim que acontecerem.'
                : 'Tente outra busca, tire um filtro ou amplie o período.'}
            </p>
          </div>
        ) : null}

        {itens.length > 0 ? (
          <ol className="motion-safe:animate-entrar grid">
            {itens.map((linha) => (
              <LinhaDeAuditoria key={linha.id} linha={linha} />
            ))}
          </ol>
        ) : null}

        {trilha.data ? (
          <Paginacao
            pagina={trilha.data.pagina}
            totalPaginas={trilha.data.total_paginas}
            total={trilha.data.total}
            ocupado={trilha.isFetching}
            aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
          />
        ) : null}
      </Cartao>
    </>
  )
}
