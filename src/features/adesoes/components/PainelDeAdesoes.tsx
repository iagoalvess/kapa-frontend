import { Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { Avatar } from '@/components/Avatar'
import { Chip } from '@/components/Chip'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useBaixarPdf } from '../hooks/useAderir'
import { useLembrar, useSituacoes } from '../hooks/usePainel'
import type { ResumoDeAdesoes, SituacaoDeAdesao } from '../types/adesoes.types'

const TAMANHO_DA_PAGINA = 20

/** Situação como vai na URL e o filtro `aderiu` que ela vira na API. */
const SITUACOES = {
  todos: { rotulo: 'Todos', aderiu: undefined },
  aderiram: { rotulo: 'Aderiram', aderiu: true },
  faltam: { rotulo: 'Faltam', aderiu: false },
} as const

type Situacao = keyof typeof SITUACOES

const ehSituacao = (valor: string | null): valor is Situacao => valor !== null && valor in SITUACOES

interface Props {
  resumo?: ResumoDeAdesoes
  /** Versão vigente do termo: quem aderiu a uma anterior aparece "na v1" — e pode ser lembrado. */
  versaoVigente?: number
  /** Botões da tela, ao lado da busca — é onde moram as ações do termo. */
  acoes?: ReactNode
}

/**
 * Quem aderiu e quem falta, na lista do modelo de equipe: filtros com contagem, busca, o avatar de
 * cada um, a situação num selo e, na linha, o PDF de quem aderiu e o lembrete de quem falta.
 *
 * O lembrete é manual e um por vez; na Sprint 13 vira régua automática. Situação, busca e página
 * vivem na URL.
 */
export function PainelDeAdesoes({ resumo, versaoVigente, acoes }: Props) {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()

  const situacaoNaUrl = parametros.get('situacao')
  const situacao: Situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : 'todos'

  /** Grava mudanças na URL; vazio remove o parâmetro. Filtro novo sempre volta à página 1. */
  const ordenacao = useOrdenacao(atualizar)
  const situacoes = useSituacoes({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    aderiu: SITUACOES[situacao].aderiu,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })

  const contagens: Record<Situacao, number | undefined> = {
    todos: resumo?.membros,
    aderiram: resumo?.aderiram,
    faltam: resumo ? resumo.membros - resumo.aderiram : undefined,
  }

  if (situacoes.data && situacoes.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, situacoes.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <FiltrosDaPlanilha
        // "Todos" é tirar o filtro: fica sozinho na primeira linha, como a situação em Membros.
        principal={
          <Chip
            tom="claro"
            ativo={situacao === 'todos'}
            contagem={contagens.todos}
            onClick={() => atualizar({ situacao: null })}
          >
            {SITUACOES.todos.rotulo}
          </Chip>
        }
        legenda="Situação"
        filtros={(['aderiram', 'faltam'] as const).map((valor) => (
          <Chip
            key={valor}
            ativo={situacao === valor}
            contagem={contagens[valor]}
            onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
          >
            {SITUACOES[valor].rotulo}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar membro',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={acoes}
        contagem={{
          mostrando: situacoes.data?.itens.length ?? 0,
          total: situacoes.data?.total ?? 0,
          unidade: 'membros',
        }}
      />

      <Planilha
        rotulo="Adesões dos membros"
        consulta={situacoes}
        vazio={{
          titulo: situacao === 'aderiram' && !busca ? 'Ninguém aderiu ainda' : 'Nenhum membro encontrado',
          dica:
            situacao === 'aderiram' && !busca
              ? 'Quem aceitar o termo aparece aqui, com a versão e a data.'
              : 'Tente outra busca ou tire o filtro.',
          // Lista que ainda vai encher não é busca frustrada.
          mascote: situacao === 'aderiram' && !busca ? mascoteChecklist : undefined,
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="membro">Membro</ColunaOrdenavel>
            <ColunaOrdenavel coluna="papel">Papel</ColunaOrdenavel>
            <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
            <ColunaOrdenavel coluna="aceito_em">Aceito em</ColunaOrdenavel>
            <th className="py-3 font-normal">
              <span className="sr-only">Ações</span>
            </th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(situacoes.data?.itens ?? []).map((membro) => (
          <LinhaDeAdesao key={membro.usuario_id} membro={membro} versaoVigente={versaoVigente} />
        ))}
      </Planilha>
    </>
  )
}

function LinhaDeAdesao({ membro, versaoVigente }: { membro: SituacaoDeAdesao; versaoVigente?: number }) {
  const pdf = useBaixarPdf()
  const lembrar = useLembrar()
  const liberado = useEscritaLiberada()

  const { adesao_id } = membro
  const naVigente = typeof membro.versao === 'number' && membro.versao === versaoVigente
  const podeLembrar = versaoVigente !== undefined && !naVigente

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <Avatar nome={membro.nome} semente={membro.usuario_id} className="size-8 text-sm" />
          <div className="grid min-w-0">
            <span className="text-foreground truncate font-medium">{membro.nome}</span>
            <span className="text-texto-muted truncate">{membro.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Selo tom={membro.papel === 'Presidente' ? 'marca' : 'neutro'}>{ROTULOS_DE_PAPEL[membro.papel]}</Selo>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        {typeof membro.versao !== 'number' ? (
          <Selo tom="alerta">Falta aderir</Selo>
        ) : naVigente ? (
          <Selo tom="sucesso">Aderiu · v{formatarNumero(membro.versao)}</Selo>
        ) : (
          <Selo tom="cinza">Na v{formatarNumero(membro.versao)}</Selo>
        )}
      </td>
      <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap tabular-nums">
        {formatarData(membro.aceito_em)}
      </td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          {adesao_id ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pdf.isPending}
              aria-label={`Baixar o termo de ${membro.nome}`}
              onClick={() =>
                pdf.mutate(
                  { adesao_id, versao: membro.versao ?? 1 },
                  { onError: (erro) => toast.error(mensagemDoErro(erro)) },
                )
              }
            >
              <Download aria-hidden />
              PDF
            </Button>
          ) : null}
          {podeLembrar ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!liberado || lembrar.isPending || lembrar.isSuccess}
              aria-label={`Lembrar ${membro.nome}`}
              onClick={() =>
                lembrar.mutate(membro.usuario_id, {
                  onSuccess: () => toast.info(`Lembrete enviado para ${membro.nome}.`),
                  onError: (erro) => toast.error(mensagemDoErro(erro)),
                })
              }
            >
              {lembrar.isSuccess ? 'Lembrado' : 'Lembrar'}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
