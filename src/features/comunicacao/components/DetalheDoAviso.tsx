import { CalendarClock, Eye, type LucideIcon, Pencil, Pin, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarDataHora, formatarDataRelativa } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useExcluirAviso } from '../hooks/useAvisos'
import { type Aviso, ROTULOS_DE_VISIBILIDADE } from '../types/comunicacao.types'

/**
 * O aviso aberto, no cartão grande do mural: os selos, o texto inteiro, quem publicou e quando, e —
 * para a Gestão — corrigir e excluir.
 *
 * Editar só marca `?editar=1`: quem troca a leitura pelo editor é o mural, que dá a largura
 * inteira ao markdown com a prévia ao lado. Excluir pede confirmação e volta para a lista; quem
 * excluiu fica na auditoria da API.
 */
export function DetalheDoAviso({ aviso, gestao }: { aviso: Aviso; gestao: boolean }) {
  const [, definirParametros] = useSearchParams()
  const editavel = useEscritaLiberada()
  const corrigido = aviso.atualizado_em !== aviso.publicado_em

  return (
    <Cartao
      // Altura mínima generosa: o aviso de duas linhas não deixa um cartão atarracado ao lado de uma
      // lista comprida, e o longo cresce à vontade a partir dela.
      className="min-h-[40rem] min-w-0"
      titulo={aviso.titulo}
      selo={
        <>
          {aviso.fixado ? <Selo tom="marca">Fixado</Selo> : null}
          {aviso.destaque ? <Selo tom="marca">Importante</Selo> : null}
          {aviso.visibilidade === 'SomenteComissao' ? <Selo tom="cinza">Só comissão</Selo> : null}
        </>
      }
      acao={
        gestao ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!editavel}
              onClick={() => definirParametros({ editar: '1' })}
            >
              Editar
            </Button>
            <ExcluirAviso aviso={aviso} desabilitado={!editavel} />
          </>
        ) : null
      }
    >
      {/* Autor, data e para quem ficam acima do texto, e não num cartão ao lado: a coluna da
          esquerda já é a lista, e um terceiro cartão espremeria a leitura. */}
      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-b pb-4">
        <Dado icone={UserRound} rotulo="Publicado por">
          {aviso.autor ?? 'Comissão'}
        </Dado>
        <Dado icone={CalendarClock} rotulo="Publicado em">
          <time dateTime={aviso.publicado_em} title={formatarDataHora(aviso.publicado_em)}>
            {formatarDataRelativa(aviso.publicado_em)}
          </time>
        </Dado>
        {corrigido ? (
          <Dado icone={Pencil} rotulo="Corrigido em">
            <time dateTime={aviso.atualizado_em}>{formatarDataHora(aviso.atualizado_em)}</time>
          </Dado>
        ) : null}
        <Dado icone={Eye} rotulo="Para quem">
          {ROTULOS_DE_VISIBILIDADE[aviso.visibilidade]}
        </Dado>
        <Dado icone={Pin} rotulo="No mural">
          {aviso.fixado ? 'Fixado no topo' : 'Na ordem de publicação'}
        </Dado>
      </dl>

      <TextoEmMarkdown conteudo={aviso.conteudo} className="max-w-prose" />
    </Cartao>
  )
}

/** Um par ícone · rótulo · valor da faixa de cima, em coluna para o rótulo não roubar a linha. */
function Dado({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: LucideIcon
  rotulo: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <Icone className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="grid gap-0.5">
        <dt className="text-muted-foreground text-xs">{rotulo}</dt>
        <dd className="text-foreground text-sm">{children}</dd>
      </div>
    </div>
  )
}

function ExcluirAviso({ aviso, desabilitado }: { aviso: Aviso; desabilitado: boolean }) {
  const excluir = useExcluirAviso()
  const navegar = useNavigate()

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button variant="outline" size="sm" disabled={desabilitado || excluir.isPending}>
          Excluir
        </Button>
      }
      titulo="Excluir o aviso?"
      descricao={`“${aviso.titulo}” sai do mural para todos. A exclusão fica registrada com o seu nome, e não há como recuperar o texto.`}
      rotulo="Excluir"
      destrutivo
      aoConfirmar={() =>
        excluir.mutate(aviso.id, {
          onSuccess: () => {
            toast.info('Aviso excluído.')
            navegar(ROTAS.mural)
          },
          onError: (erro) => toast.error(mensagemDoErro(erro)),
        })
      }
    />
  )
}
